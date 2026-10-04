import { z } from "zod";

const ConfigSchema = z.object({ MONGODB_URI: z.string().min(1) });
export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(env = process.env): Config {
	return ConfigSchema.parse(env);
}
