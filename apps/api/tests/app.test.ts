import { assignTag, scan } from "@vesta/core";
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

	it("GET /api/list returns an empty array when nothing is on the list", async () => {
		const res = await createApp(db(), auth).request("/api/list");

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual([]);
	});

	it("GET /api/list returns the scanned entries", async () => {
		await assignTag(db(), "h1", "abc234", { name: "Olive oil" });
		await scan(db(), "h1", "abc234", "u1");

		const res = await createApp(db(), auth).request("/api/list");

		expect(await res.json()).toMatchObject([{ name: "Olive oil", qty: 1 }]);
	});

	it("GET /api/list only returns this household's entries", async () => {
		await assignTag(db(), "h2", "abc234", { name: "Olive oil" });
		await scan(db(), "h2", "abc234", "u2");

		const res = await createApp(db(), auth).request("/api/list");

		expect(await res.json()).toEqual([]);
	});
});
