import { type Db, MongoClient } from "mongodb";

export async function connect(uri: string) {
	// connection function for connecting to the mongo database!
	const client = new MongoClient(uri);
	await client.connect();
	const db = client.db();
	await ensureIndexes(db);
	return { client, db };
}

export async function ensureIndexes(db: Db) {
	await db
		.collection("shoppingLists")
		.createIndex({ householdId: 1, status: 1 });
	await db
		.collection("ingredients")
		.createIndex({ householdId: 1, aliases: 1 });
	await db.collection("events").createIndex({ householdId: 1, type: 1, at: 1 });
}
