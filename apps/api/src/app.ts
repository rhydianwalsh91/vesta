import { zValidator } from "@hono/zod-validator";
import {
	assignTag,
	getList,
	removeEntry,
	scan,
	TagAlreadyAssignedError,
	updateEntry,
} from "@vesta/core";
import {
	AssignTagInputSchema,
	TagIdSchema,
	UpdateEntryInputSchema,
} from "@vesta/shared";
import { Hono } from "hono";
import type { Db } from "mongodb";
import { z } from "zod";

const EntryParamSchema = z.object({ entryId: z.string().min(1) });

export type Auth = { householdId: string; userId: string };

export function createApp(db: Db, auth: Auth) {
	const app = new Hono<{ Variables: Auth }>();
	// Ensures that all API endpoints have the correct auth
	app.use("/api/*", async (c, next) => {
		c.set("householdId", auth.householdId);
		c.set("userId", auth.userId);
		await next();
	});

	// Ensure API up and running
	app.get("/health", (c) => {
		return c.json({ ok: true });
	});

	// List all the items on the shopping list.
	app.get("/api/list", async (c) => {
		const list = await getList(db, c.get("householdId"));
		return c.json(list);
	});

	// A scan is a POST so link previews and prefetching can never add items.
	app.post(
		"/api/scan/:tagId",
		zValidator("param", z.object({ tagId: TagIdSchema })),
		async (c) => {
			const { tagId } = c.req.valid("param");
			const result = await scan(
				db,
				c.get("householdId"),
				tagId,
				c.get("userId"),
			);
			return c.json(result); // "unregistered" is a normal answer, not an error
		},
	);

	// Registers a tag: creates the pantry item (and ingredient) and links the tag.
	app.post(
		"/api/tags/:tagId/assign",
		zValidator("param", z.object({ tagId: TagIdSchema })),
		zValidator("json", AssignTagInputSchema),
		async (c) => {
			const { tagId } = c.req.valid("param");
			try {
				const item = await assignTag(
					db,
					c.get("householdId"),
					tagId,
					c.req.valid("json"),
				);
				return c.json(item, 201);
			} catch (err) {
				if (err instanceof TagAlreadyAssignedError) {
					return c.json({ error: err.message }, 409);
				}
				throw err;
			}
		},
	);

	// Check an entry off or change its quantity.
	app.patch(
		"/api/list/entries/:entryId",
		zValidator("param", EntryParamSchema),
		zValidator("json", UpdateEntryInputSchema),
		async (c) => {
			const { entryId } = c.req.valid("param");
			const entry = await updateEntry(
				db,
				c.get("householdId"),
				entryId,
				c.req.valid("json"),
			);
			return entry ? c.json(entry) : c.json({ error: "Entry not found" }, 404);
		},
	);

	app.delete(
		"/api/list/entries/:entryId",
		zValidator("param", EntryParamSchema),
		async (c) => {
			const { entryId } = c.req.valid("param");
			const removed = await removeEntry(db, c.get("householdId"), entryId);
			return removed
				? c.body(null, 204)
				: c.json({ error: "Entry not found" }, 404);
		},
	);

	// Anything unexpected: log it, but never leak details to the client.
	app.onError((err, c) => {
		console.error(err);
		return c.json({ error: "Internal error" }, 500);
	});

	return app;
}
