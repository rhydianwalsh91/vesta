import { describe, expect, it } from "vitest";
import {
	AssignTagInputSchema,
	ScanResultSchema,
	TagIdSchema,
	UpdateEntryInputSchema,
} from "../src/index.js";

const entry = {
	id: "e1",
	ingredientId: "i1",
	name: "Olive oil",
	qty: 1,
	source: { kind: "scan" },
	addedBy: "u1",
	addedAt: "2026-01-01T00:00:00Z",
};

describe("TagIdSchema", () => {
	it("accepts 6 lowercase alphanumerics", () => {
		expect(TagIdSchema.safeParse("k3x9ab").success).toBe(true);
	});
	it.each(["K3x9ab", "k3x9a", "k3x9abc", "k3x-ab"])("rejects %s", (id) => {
		expect(TagIdSchema.safeParse(id).success).toBe(false);
	});
});

describe("ScanResultSchema", () => {
	it("parses an added result and defaults checked to false", () => {
		const r = ScanResultSchema.parse({ result: "added", entry });
		expect(r.result === "added" && r.entry.checked).toBe(false);
	});
	it("parses unregistered with a tag id", () => {
		expect(
			ScanResultSchema.safeParse({ result: "unregistered", tagId: "k3x9ab" })
				.success,
		).toBe(true);
	});
	it("rejects an unknown result", () => {
		expect(ScanResultSchema.safeParse({ result: "nope" }).success).toBe(false);
	});
});

describe("input schemas", () => {
	it("AssignTagInput rejects a blank name", () => {
		expect(AssignTagInputSchema.safeParse({ name: "  " }).success).toBe(false);
	});
	it("UpdateEntryInput needs checked or qty", () => {
		expect(UpdateEntryInputSchema.safeParse({}).success).toBe(false);
		expect(UpdateEntryInputSchema.safeParse({ checked: true }).success).toBe(
			true,
		);
		expect(UpdateEntryInputSchema.safeParse({ qty: 0 }).success).toBe(false);
	});
});
