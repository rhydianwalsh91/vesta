import { MongoClient, ObjectId } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { collections, type PantryItemDoc } from "../../src/db.js";
import { addToList } from "../../src/shopping/addToList.js";

let server: MongoMemoryServer;
let client: MongoClient;
const db = () => client.db("test");

beforeAll(async () => {
	server = await MongoMemoryServer.create();
	client = await MongoClient.connect(server.getUri());
});

afterAll(async () => {
	await client.close();
	await server.stop();
});

beforeEach(async () => {
	await db().dropDatabase();
});

const pantryItem = (name: string): PantryItemDoc => ({
	_id: new ObjectId(),
	householdId: "h1",
	ingredientId: new ObjectId().toHexString(),
	name,
	status: "in",
	schemaVersion: 1,
});

describe("addToList", () => {
	it("creates the active list and adds an entry on the first scan", async () => {
		const oil = pantryItem("Olive oil");
		const r = await addToList(db(), "h1", oil, "u1");

		expect(r.result).toBe("added");
		expect(r.entry).toMatchObject({
			name: "Olive oil",
			qty: 1,
			checked: false,
			source: { kind: "scan" },
			addedBy: "u1",
		});

		const lists = await collections(db()).shoppingLists.find().toArray();
		expect(lists).toHaveLength(1);
		expect(lists[0]).toMatchObject({
			householdId: "h1",
			status: "active",
			schemaVersion: 1,
		});
		expect(lists[0]?.entries).toHaveLength(1);
	});

	it("increments the quantity when the same item is scanned again", async () => {
		const oil = pantryItem("Olive oil");
		await addToList(db(), "h1", oil, "u1");
		const r = await addToList(db(), "h1", oil, "u1");

		expect(r.result).toBe("incremented");
		expect(r.entry.qty).toBe(2);

		const list = await collections(db()).shoppingLists.findOne();
		expect(list?.entries).toHaveLength(1);
		expect(list?.entries[0]?.qty).toBe(2);
	});

	it("adds a fresh entry when the existing one is already checked off", async () => {
		const oil = pantryItem("Olive oil");
		const first = await addToList(db(), "h1", oil, "u1");
		await collections(db()).shoppingLists.updateOne(
			{ householdId: "h1" },
			{ $set: { "entries.$[e].checked": true } },
			{ arrayFilters: [{ "e.id": first.entry.id }] },
		);

		const r = await addToList(db(), "h1", oil, "u1");

		expect(r.result).toBe("added");
		expect(r.entry.id).not.toBe(first.entry.id);
		const list = await collections(db()).shoppingLists.findOne();
		expect(list?.entries).toHaveLength(2);
		expect(list?.entries.find((e) => e.id === first.entry.id)?.qty).toBe(1);
	});

	it("keeps different items as separate entries", async () => {
		await addToList(db(), "h1", pantryItem("Olive oil"), "u1");
		await addToList(db(), "h1", pantryItem("Rice"), "u1");

		const list = await collections(db()).shoppingLists.findOne();
		expect(list?.entries.map((e) => e.name)).toEqual(["Olive oil", "Rice"]);
		expect(list?.entries.every((e) => e.qty === 1)).toBe(true);
	});

	it("keeps households separate", async () => {
		const oil = pantryItem("Olive oil");
		await addToList(db(), "h1", oil, "u1");
		const r = await addToList(db(), "h2", oil, "u2");

		expect(r.result).toBe("added");
		const lists = await collections(db()).shoppingLists.find().toArray();
		expect(lists).toHaveLength(2);
		const h1 = lists.find((l) => l.householdId === "h1");
		expect(h1?.entries[0]?.qty).toBe(1);
	});
});
