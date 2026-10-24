import type { Ingredient, PantryItem, ShoppingList, Tag } from "@vesta/shared";
import { type Db, MongoClient, type ObjectId } from "mongodb";

// Override with MongoDb ids for documents.
export type IngredientDoc = Omit<Ingredient, "id"> & { _id: ObjectId };
export type PantryItemDoc = Omit<PantryItem, "id"> & { _id: ObjectId };
export type ShoppingListDoc = Omit<ShoppingList, "id"> & { _id: ObjectId };
export type TagDoc = Omit<Tag, "id"> & { _id: string };

//TODO potentially move somewhere else?
export type EventDoc = {
	_id: ObjectId;
	householdId: string;
	type: "scanned";
	refs: { tagId: string; pantryItemId: string };
	at: string;
	by: string;
};

export function collections(db: Db) {
	return {
		ingredients: db.collection<IngredientDoc>("ingredients"),
		pantryItems: db.collection<PantryItemDoc>("pantryItems"),
		shoppingLists: db.collection<ShoppingListDoc>("shoppingLists"),
		tags: db.collection<TagDoc>("tags"),
		events: db.collection<EventDoc>("events"),
	};
}
// Connection function for connecting to the mongo database.
export async function connect(uri: string) {
	const client = new MongoClient(uri);
	await client.connect();
	const db = client.db();
	await ensureIndexes(db);
	return { client, db };
}

// Function that creates/ensures the indexes within the Mongo Database exists (i.e. Ingredient, shopping lists etc.)
export async function ensureIndexes(db: Db) {
	const c = collections(db);
	await c.shoppingLists.createIndex({ householdId: 1, status: 1 });
	await c.ingredients.createIndex({ householdId: 1, aliases: 1 });
	await c.pantryItems.createIndex({ householdId: 1, ingredientId: 1 });
	await c.tags.createIndex({ householdId: 1, pantryItemId: 1 });
	await c.events.createIndex({ householdId: 1, type: 1, at: 1 });
}
