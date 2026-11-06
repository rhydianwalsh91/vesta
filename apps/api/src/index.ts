import { serve } from "@hono/node-server";
import { connect, loadConfig } from "@vesta/core";
import { createApp } from "./app.js";

const config = loadConfig();
const { db } = await connect(config.MONGODB_URI);
const app = createApp(db, {
	householdId: config.HOUSEHOLD_ID,
	userId: config.USER_ID,
});

const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port }, () => {
	console.log(`vesta api listening on http://localhost:${port}`);
});
