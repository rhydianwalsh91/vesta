import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { connect, loadConfig } from "@vesta/core";
import { createApp } from "./app.js";

const config = loadConfig(process.env);
const { db } = await connect(config.MONGODB_URI);
const app = createApp(db, {
	householdId: config.HOUSEHOLD_ID,
	userId: config.USER_ID,
});

// In production the API also serves the built web app, so both share one domain.
// In dev there's no build and Vite serves the app instead.
const webDist = fileURLToPath(new URL("../../web/dist", import.meta.url));
if (existsSync(webDist)) {
	app.use("*", serveStatic({ root: webDist }));
	// /list, /t/:tagId etc. are client-side routes: any other GET gets index.html,
	// so a tag opened straight from NFC loads the app. /api/* still 404s.
	const spa = serveStatic({ root: webDist, path: "index.html" });
	app.get("*", (c, next) =>
		c.req.path.startsWith("/api/") ? next() : spa(c, next),
	);
}

const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port }, () => {
	console.log(`vesta api listening on http://localhost:${port}`);
});
