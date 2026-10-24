import { z } from "zod";

export const PantryStatusSchema = z.enum(["in", "low", "out"]);

export const PantryItemSchema = z.object({
	id: z.string(),
	householdId: z.string(),
	ingredientId: z.string(),
	name: z.string(),
	location: z.string().optional(),
	status: PantryStatusSchema,
	schemaVersion: z.literal(1),
});

export type PantryStatus = z.infer<typeof PantryStatusSchema>;
export type PantryItem = z.infer<typeof PantryItemSchema>;
