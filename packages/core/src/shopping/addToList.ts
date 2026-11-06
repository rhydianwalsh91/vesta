import type { ShoppingEntry } from "@vesta/shared";
import { type Db, ObjectId } from "mongodb";
import { collections, type PantryItemDoc } from "../db.js";

export async function addToList(
	db: Db,
	householdId: string,
	pantryItem: PantryItemDoc,
	userId: string,
): Promise<{ result: "added" | "incremented"; entry: ShoppingEntry }> {
	const { shoppingLists } = collections(db);
	const pantryItemId = pantryItem._id.toHexString();

	// Already on the list and unchecked? Bump its quantity.
	const list = await shoppingLists.findOneAndUpdate(
		{
			householdId,
			status: "active",
			entries: { $elemMatch: { pantryItemId, checked: false } },
		},
		{ $inc: { "entries.$.qty": 1 } },
		{ returnDocument: "after" },
	);
	const existing = list?.entries.find(
		(e) => e.pantryItemId === pantryItemId && !e.checked,
	);
	if (existing) {
		return { result: "incremented", entry: existing };
	}

	// Otherwise add a new entry
	const entry: ShoppingEntry = {
		id: new ObjectId().toHexString(),
		ingredientId: pantryItem.ingredientId,
		pantryItemId,
		name: pantryItem.name,
		qty: 1,
		checked: false,
		source: { kind: "scan" },
		addedBy: userId,
		addedAt: new Date().toISOString(),
	};
	await shoppingLists.updateOne(
		{ householdId, status: "active" },
		{ $push: { entries: entry }, $setOnInsert: { schemaVersion: 1 } },
		{ upsert: true },
	);
	return { result: "added", entry };
}
