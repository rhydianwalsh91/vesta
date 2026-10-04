// Throwaway check that we can talk to the Docker Mongo: write one document, read it back.
import { connect, loadConfig } from "../src/index.js";

const config = loadConfig();
const { client, db } = await connect(config.MONGODB_URI);
try {
	const smoke = db.collection("smoke");

	const result = await smoke.insertOne({ hello: "vesta", at: new Date() });
	const found = await smoke.findOne({ _id: result.insertedId });
	console.log("inserted and read back:", found);

	const indexes = await db.collection("shoppingLists").indexes();
	console.log(
		"shoppingLists indexes:",
		indexes.map((index) => index.name),
	);

	await smoke.drop();
} finally {
	await client.close();
}
