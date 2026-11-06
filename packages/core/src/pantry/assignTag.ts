import type { AssignTagInput } from "@vesta/shared";
import { type Db, ObjectId } from "mongodb";
import { collections, type PantryItemDoc } from "../db.js";

export async function assignTag(
	db: Db,
	householdId: string,
	tagId: string,
	input: AssignTagInput,
): Promise<PantryItemDoc> {
	const c = collections(db);
	const existingTag = await c.tags.findOne({ _id: tagId, householdId });
	if (existingTag?.pantryItemId)
		throw new Error(`Tag ${tagId} is already assigned`);

	// Reuse an ingredient that matches by name or alias, otherwise create one.
	let ingredient = await c.ingredients.findOne({
		householdId,
		$or: [{ name: input.name }, { aliases: input.name }],
	});
	if (!ingredient) {
		ingredient = {
			_id: new ObjectId(),
			householdId,
			name: input.name,
			aliases: [],
			category: "other", // ponytail: no category picker yet
			baseUnit: "unit",
			schemaVersion: 1,
		};
		await c.ingredients.insertOne(ingredient);
	}

	const item: PantryItemDoc = {
		_id: new ObjectId(),
		householdId,
		ingredientId: ingredient._id.toHexString(),
		name: input.name,
		...(input.location && { location: input.location }),
		status: "in",
		schemaVersion: 1,
	};
	await c.pantryItems.insertOne(item);

	await c.tags.updateOne(
		{ _id: tagId, householdId },
		{
			$set: { pantryItemId: item._id.toHexString() },
			$setOnInsert: { createdAt: new Date().toISOString(), schemaVersion: 1 },
		},
		{ upsert: true },
	);
	return item;
}
