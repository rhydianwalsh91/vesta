import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/index.js";

const env = {
	MONGODB_URI: "mongodb://localhost/test",
	HOUSEHOLD_ID: "h1",
	USER_ID: "u1",
};

describe("loadConfig", () => {
	it("returns the config when everything is set", () => {
		expect(loadConfig(env)).toEqual(env);
	});

	it.each(Object.keys(env))("throws when %s is missing", (key) => {
		const { [key]: _, ...rest } = env as Record<string, string>;
		expect(() => loadConfig(rest)).toThrow();
	});

	it("throws when an ID is empty", () => {
		expect(() => loadConfig({ ...env, HOUSEHOLD_ID: "" })).toThrow();
	});
});
