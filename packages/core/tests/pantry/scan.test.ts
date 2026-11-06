import { describe, expect, it } from "vitest";
import { collections } from "../../src/db.js";
import { assignTag } from "../../src/pantry/assignTag.js";
import { scan } from "../../src/pantry/scan.js";
import { useTestDb } from "../helpers.js";

const db = useTestDb();

describe("scan", () => {
	it("Scans an unregistered tag", async () => {
		const r = await scan(db(), "h1", "abc234", "u1");
		expect(r).toEqual({ result: "unregistered", tagId: "abc234" });
		expect(await collections(db()).events.countDocuments()).toBe(0);
	});

	it("Scans a registered tag for the first time, added", async () => {
		await assignTag(db(), "h1", "abc234", { name: "Olive oil" });
		const r = await scan(db(), "h1", "abc234", "u1");

		expect(r).toMatchObject({
			result: "added",
			entry: { name: "Olive oil", qty: 1 },
		});
		const events = await collections(db()).events.find().toArray();
		expect(events).toHaveLength(1);
		expect(events[0]).toMatchObject({
			type: "scanned",
			refs: { tagId: "abc234" },
			by: "u1",
		});
	});

	it("Scans an existing scan for the second time, incremented", async () => {
		await assignTag(db(), "h1", "abc234", { name: "Olive oil" });
		await scan(db(), "h1", "abc234", "u1");
		const r = await scan(db(), "h1", "abc234", "u1");

		expect(r).toMatchObject({ result: "incremented", entry: { qty: 2 } });
		expect(await collections(db()).events.countDocuments()).toBe(2);
	});

	it("does not see another household's tag", async () => {
		await assignTag(db(), "h1", "abc234", { name: "Olive oil" });
		const r = await scan(db(), "h2", "abc234", "u2");
		expect(r.result).toBe("unregistered");
	});
});
