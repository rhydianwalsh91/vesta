import { MongoClient } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach } from "vitest";

// Call once at the top of a test file: starts an in-memory Mongo and wipes it between tests.
// ponytail: copied from packages/core/tests/helpers.ts, share it if a third package needs it.
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
