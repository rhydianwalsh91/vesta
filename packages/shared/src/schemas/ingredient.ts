import { z } from "zod";

export const IngredientSchema = z.object({
	id: z.string(),
	householdId: z.string(),
	name: z.string(),
	aliases: z.array(z.string()),
	category: z.string(),
	baseUnit: z.string(),
	schemaVersion: z.literal(1),
});

export type Ingredient = z.infer<typeof IngredientSchema>;
