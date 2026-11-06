import { assignTag, scan } from "@vesta/core";
import type { Db } from "mongodb";
import { describe, expect, it, vi } from "vitest";
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

	const post = (path: string) =>
		createApp(db(), auth).request(path, { method: "POST" });

	it("POST /api/scan/:tagId reports an unregistered tag", async () => {
		const res = await post("/api/scan/abc234");

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({
			result: "unregistered",
			tagId: "abc234",
		});
	});

	it("POST /api/scan/:tagId adds then increments", async () => {
		await assignTag(db(), "h1", "abc234", { name: "Olive oil" });

		const first = await (await post("/api/scan/abc234")).json();
		const second = await (await post("/api/scan/abc234")).json();

		expect(first).toMatchObject({ result: "added", entry: { qty: 1 } });
		expect(second).toMatchObject({ result: "incremented", entry: { qty: 2 } });
	});

	it("POST /api/scan/:tagId rejects a malformed tag id with 400", async () => {
		const res = await post("/api/scan/NOPE!");

		expect(res.status).toBe(400);
	});

	it("GET /api/scan/:tagId is not allowed", async () => {
		const res = await createApp(db(), auth).request("/api/scan/abc234");

		expect(res.status).toBe(404);
	});

	const assign = (tagId: string, body: unknown) =>
		createApp(db(), auth).request(`/api/tags/${tagId}/assign`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(body),
		});

	it("POST /api/tags/:tagId/assign registers the tag so it can be scanned", async () => {
		const res = await assign("abc234", {
			name: "Olive oil",
			location: "Cupboard",
		});

		expect(res.status).toBe(201);
		expect(await res.json()).toMatchObject({ name: "Olive oil", status: "in" });
		const scanned = await (await post("/api/scan/abc234")).json();
		expect(scanned).toMatchObject({
			result: "added",
			entry: { name: "Olive oil" },
		});
	});

	it("POST /api/tags/:tagId/assign rejects an empty name with 400", async () => {
		expect((await assign("abc234", { name: "  " })).status).toBe(400);
	});

	it("POST /api/tags/:tagId/assign rejects a malformed tag id with 400", async () => {
		expect((await assign("NOPE!", { name: "Rice" })).status).toBe(400);
	});

	it("POST /api/tags/:tagId/assign returns 409 for an already assigned tag", async () => {
		await assign("abc234", { name: "Rice" });
		const res = await assign("abc234", { name: "Pasta" });

		expect(res.status).toBe(409);
	});

	const seedEntry = async () => {
		await assignTag(db(), "h1", "abc234", { name: "Olive oil" });
		const r = await scan(db(), "h1", "abc234", "u1");
		if (r.result === "unregistered") throw new Error("seed failed");
		return r.entry.id;
	};

	const patch = (id: string, body: unknown) =>
		createApp(db(), auth).request(`/api/list/entries/${id}`, {
			method: "PATCH",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(body),
		});

	const del = (id: string) =>
		createApp(db(), auth).request(`/api/list/entries/${id}`, {
			method: "DELETE",
		});

	it("PATCH /api/list/entries/:id checks off and changes quantity", async () => {
		const id = await seedEntry();
		const res = await patch(id, { checked: true, qty: 3 });

		expect(res.status).toBe(200);
		expect(await res.json()).toMatchObject({ id, checked: true, qty: 3 });
	});

	it("PATCH /api/list/entries/:id returns 404 for an unknown entry", async () => {
		expect((await patch("nope", { checked: true })).status).toBe(404);
	});

	it("PATCH /api/list/entries/:id rejects an empty or invalid body with 400", async () => {
		const id = await seedEntry();

		expect((await patch(id, {})).status).toBe(400);
		expect((await patch(id, { qty: -1 })).status).toBe(400);
	});

	it("DELETE /api/list/entries/:id removes the entry", async () => {
		const id = await seedEntry();
		const res = await del(id);

		expect(res.status).toBe(204);
		const list = await (
			await createApp(db(), auth).request("/api/list")
		).json();
		expect(list).toEqual([]);
	});

	it("DELETE /api/list/entries/:id returns 404 for an unknown entry", async () => {
		expect((await del("nope")).status).toBe(404);
	});

	it("returns a generic 500 without leaking details when something throws", async () => {
		const brokenDb = {
			collection: () => {
				throw new Error("secret connection string");
			},
		} as unknown as Db;
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});

		const res = await createApp(brokenDb, auth).request("/api/list");

		expect(res.status).toBe(500);
		expect(await res.json()).toEqual({ error: "Internal error" });
		expect(spy).toHaveBeenCalled();
		spy.mockRestore();
	});
});
