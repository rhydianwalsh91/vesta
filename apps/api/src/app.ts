import { Hono } from "hono";
import type { Db } from "mongodb";

export type Auth = { householdId: string; userId: string };

export function createApp(db: Db, auth: Auth) {
	const app = new Hono<{ Variables: Auth }>();
	app.use("/api/*", async (c, next) => {
		c.set("householdId", auth.householdId);
		c.set("userId", auth.userId);
		await next();
	});

	app.get("/api/whoami", (c) => {
		return c.json({ householdId: c.get("householdId") });
	});

	app.get("/health", (c) => {
		return c.json({ ok: true });
	});
	return app;
}
