import { z } from "zod";

export const TagIdSchema = z.string().regex(/^[a-z0-9]{6}$/);

export const TagSchema = z.object({
	id: TagIdSchema,
	householdId: z.string(),
	pantryItemId: z.string().nullable(),
	createdAt: z.string(),
	schemaVersion: z.literal(1),
});

export type Tag = z.infer<typeof TagSchema>;
