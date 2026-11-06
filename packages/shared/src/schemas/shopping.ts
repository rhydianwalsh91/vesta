import { z } from "zod";

export const EntrySourceSchema = z.object({
	kind: z.enum(["scan", "recipe", "manual"]),
	refId: z.string().optional(),
});

export const ShoppingEntrySchema = z.object({
	id: z.string(),
	ingredientId: z.string(),
	pantryItemId: z.string().optional(),
	name: z.string(),
	qty: z.number().positive(),
	unit: z.string().optional(),
	checked: z.boolean().default(false),
	source: EntrySourceSchema,
	addedBy: z.string(),
	addedAt: z.string(),
});

export const ShoppingListSchema = z.object({
	id: z.string(),
	householdId: z.string(),
	status: z.enum(["active", "done"]),
	entries: z.array(ShoppingEntrySchema),
	schemaVersion: z.literal(1),
});

export const UpdateEntryInputSchema = z
	.object({
		checked: z.boolean().optional(),
		qty: z.number().positive().optional(),
	})
	.refine((v) => v.checked !== undefined || v.qty !== undefined, {
		message: "Provide checked or qty",
	});

export type EntrySource = z.infer<typeof EntrySourceSchema>;
export type ShoppingEntry = z.infer<typeof ShoppingEntrySchema>;
export type ShoppingList = z.infer<typeof ShoppingListSchema>;
export type UpdateEntryInput = z.infer<typeof UpdateEntryInputSchema>;
