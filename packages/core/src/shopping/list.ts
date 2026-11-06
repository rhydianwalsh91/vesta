import type { ShoppingEntry, UpdateEntryInput } from "@vesta/shared";
import type { Db } from "mongodb";
import { collections } from "../db.js";

export async function getList(db: Db, householdId: string) {
	const list = await collections(db).shoppingLists.findOne({
		householdId,
		status: "active",
	});
	return list?.entries ?? [];
}

// Returns the updated entry, or null if it doesn't exist.
export async function updateEntry(
	db: Db,
	householdId: string,
	entryId: string,
	input: UpdateEntryInput,
): Promise<ShoppingEntry | null> {
	const set: Record<string, unknown> = {};
	if (input.checked !== undefined) set["entries.$[e].checked"] = input.checked;
	if (input.qty !== undefined) set["entries.$[e].qty"] = input.qty;

	const list = await collections(db).shoppingLists.findOneAndUpdate(
		{ householdId, status: "active", "entries.id": entryId },
		{ $set: set },
		{ arrayFilters: [{ "e.id": entryId }], returnDocument: "after" },
	);
	return list?.entries.find((e) => e.id === entryId) ?? null;
}

export async function removeEntry(
	db: Db,
	householdId: string,
	entryId: string,
): Promise<boolean> {
	const r = await collections(db).shoppingLists.updateOne(
		{ householdId, status: "active", "entries.id": entryId },
		{ $pull: { entries: { id: entryId } } },
	);
	return r.modifiedCount === 1;
}
