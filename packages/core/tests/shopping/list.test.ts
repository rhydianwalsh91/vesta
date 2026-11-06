import { describe, expect, it } from "vitest";
import { addToList } from "../../src/shopping/addToList.js";
import { getList, removeEntry, updateEntry } from "../../src/shopping/list.js";
import { pantryItem, useTestDb } from "../helpers.js";

const db = useTestDb();

describe("list", () => {
	it("returns an empty list when nothing has been added", async () => {
		expect(await getList(db(), "h1")).toEqual([]);
	});

	it("checks off and changes quantity of only the target entry", async () => {
		const { entry } = await addToList(db(), "h1", pantryItem("Oil"), "u1");
		await addToList(db(), "h1", pantryItem("Rice"), "u1");

		const updated = await updateEntry(db(), "h1", entry.id, {
			checked: true,
			qty: 3,
		});
		expect(updated).toMatchObject({ checked: true, qty: 3 });

		const list = await getList(db(), "h1");
		expect(list[0]).toMatchObject({ checked: true, qty: 3 });
		expect(list[1]).toMatchObject({ name: "Rice", checked: false, qty: 1 });
	});

	it("returns null / false for an unknown entry or other household", async () => {
		const { entry } = await addToList(db(), "h1", pantryItem("Oil"), "u1");
		expect(await updateEntry(db(), "h1", "nope", { checked: true })).toBeNull();
		expect(
			await updateEntry(db(), "h2", entry.id, { checked: true }),
		).toBeNull();
		expect(await removeEntry(db(), "h2", entry.id)).toBe(false);
	});

	it("removes an entry", async () => {
		const { entry } = await addToList(db(), "h1", pantryItem("Oil"), "u1");
		expect(await removeEntry(db(), "h1", entry.id)).toBe(true);
		expect(await getList(db(), "h1")).toEqual([]);
	});
});
