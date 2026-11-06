import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { useTestDb } from "./helpers.js";

const db = useTestDb();
const auth = { householdId: "h1", userId: "u1" };

describe("app", () => {
	it("GET /health returns ok", async () => {
		const app = createApp(db(), auth);
		const res = await app.request("/health");

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ ok: true });
	});

	it("auth middleware exposes the household to /api routes", async () => {
		const app = createApp(db(), auth);
		const res = await app.request("/api/whoami");

		expect(await res.json()).toEqual({ householdId: "h1" });
	});
});
