import { z } from "zod";
import { ShoppingEntrySchema } from "./shopping.js";
import { TagIdSchema } from "./tag.js";

export const ScanResultSchema = z.discriminatedUnion("result", [
	z.object({ result: z.literal("added"), entry: ShoppingEntrySchema }),
	z.object({ result: z.literal("incremented"), entry: ShoppingEntrySchema }),
	z.object({ result: z.literal("unregistered"), tagId: TagIdSchema }),
]);

export const AssignTagInputSchema = z.object({
	name: z.string().trim().min(1),
	location: z.string().trim().min(1).optional(),
});

export type ScanResult = z.infer<typeof ScanResultSchema>;
export type AssignTagInput = z.infer<typeof AssignTagInputSchema>;
