import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/index.js";

const env = { MONGODB_URI: "mongodb://localhost/test" };

describe("loadConfig", () => {
	it("returns the config when MONGODB_URI is set", () => {
		expect(loadConfig(env)).toEqual({
			MONGODB_URI: "mongodb://localhost/test",
		});
	});

	it("throws when MONGODB_URI is missing", () => {
		expect(() => loadConfig({})).toThrow();
	});
});
