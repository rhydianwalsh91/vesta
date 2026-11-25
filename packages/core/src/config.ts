import { z } from "zod";

const ConfigSchema = z.object({
	MONGODB_URI: z.string().min(1),
	// ponytail: stand-in for real auth, replaced by cookie auth later.
	HOUSEHOLD_ID: z.string().min(1),
	USER_ID: z.string().min(1),
});
export type Config = z.infer<typeof ConfigSchema>;

// Takes env rather than reading process.env, so core has no Node globals
// in the type graph the web app pulls in via AppType.
export function loadConfig(env: Record<string, string | undefined>): Config {
	return ConfigSchema.parse(env);
}
