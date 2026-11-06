import { MongoClient, ObjectId } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach } from "vitest";
import type { PantryItemDoc } from "../src/db.js";

// Call once at the top of a test file: starts an in-memory Mongo and wipes it between tests.
export function useTestDb() {
	let server: MongoMemoryServer;
	let client: MongoClient;

	beforeAll(async () => {
		server = await MongoMemoryServer.create();
		client = await MongoClient.connect(server.getUri());
	});
	afterAll(async () => {
		await client.close();
		await server.stop();
	});
	beforeEach(async () => {
		await client.db("test").dropDatabase();
	});

	return () => client.db("test");
}

export const pantryItem = (name: string): PantryItemDoc => ({
	_id: new ObjectId(),
	householdId: "h1",
	ingredientId: new ObjectId().toHexString(),
	name,
	status: "in",
	schemaVersion: 1,
});
