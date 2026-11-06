import { describe, expect, it } from "vitest";
import { collections } from "../../src/db.js";
import { assignTag } from "../../src/pantry/assignTag.js";
import { useTestDb } from "../helpers.js";

const db = useTestDb();

describe("assignTag", () => {
	it("creates the ingredient, pantry item and tag", async () => {
		const item = await assignTag(db(), "h1", "abc234", {
			name: "Olive oil",
			location: "Cupboard",
		});
		const c = collections(db());

		expect(item).toMatchObject({
			name: "Olive oil",
			location: "Cupboard",
			status: "in",
		});
		expect(await c.ingredients.countDocuments()).toBe(1);
		const tag = await c.tags.findOne({ _id: "abc234" });
		expect(tag).toMatchObject({
			householdId: "h1",
			pantryItemId: item._id.toHexString(),
			schemaVersion: 1,
		});
	});

	it("reuses an existing ingredient by name", async () => {
		await assignTag(db(), "h1", "abc234", { name: "Rice" });
		await assignTag(db(), "h1", "def567", { name: "Rice" });
		expect(await collections(db()).ingredients.countDocuments()).toBe(1);
		expect(await collections(db()).pantryItems.countDocuments()).toBe(2);
	});

	it("rejects a tag that is already assigned", async () => {
		await assignTag(db(), "h1", "abc234", { name: "Rice" });
		await expect(
			assignTag(db(), "h1", "abc234", { name: "Pasta" }),
		).rejects.toThrow(/already assigned/);
	});
});
