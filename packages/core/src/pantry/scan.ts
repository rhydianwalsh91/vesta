import type { ScanResult } from "@vesta/shared";
import { type Db, ObjectId } from "mongodb";
import { collections } from "../db.js";
import { addToList } from "../shopping/addToList.js";

export async function scan(
	db: Db,
	householdId: string,
	tagId: string,
	userId: string,
): Promise<ScanResult> {
	const c = collections(db);
	const tag = await c.tags.findOne({ _id: tagId, householdId });
	// If no tag found, return unregistered
	if (!tag?.pantryItemId) return { result: "unregistered", tagId };

	const item = await c.pantryItems.findOne({
		_id: new ObjectId(tag.pantryItemId),
		householdId,
	});
	if (!item) throw new Error(`Tag ${tagId} points at a missing pantry item`);

	const { result, entry } = await addToList(db, householdId, item, userId);
	await c.events.insertOne({
		_id: new ObjectId(),
		householdId,
		type: "scanned",
		refs: { tagId, pantryItemId: item._id.toHexString() },
		at: new Date().toISOString(),
		by: userId,
	});
	return { result, entry };
}
