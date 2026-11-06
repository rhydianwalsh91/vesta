import { z } from "zod";

const ConfigSchema = z.object({
	MONGODB_URI: z.string().min(1),
	// ponytail: stand-in for real auth, replaced by cookie auth later.
	HOUSEHOLD_ID: z.string().min(1),
	USER_ID: z.string().min(1),
});
export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(env = process.env): Config {
	return ConfigSchema.parse(env);
}
