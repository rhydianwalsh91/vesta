import type { ShoppingEntry } from "@vesta/shared";

// Hardcoded until step 6 loads the real list from /api/list.
const entries: ShoppingEntry[] = [
	{
		id: "e1",
		ingredientId: "i1",
		name: "Olive oil",
		qty: 1,
		checked: false,
		source: { kind: "scan" },
		addedBy: "u1",
		addedAt: "2026-11-18T09:00:00Z",
	},
	{
		id: "e2",
		ingredientId: "i2",
		name: "Chopped tomatoes",
		qty: 2,
		unit: "tins",
		checked: false,
		source: { kind: "scan" },
		addedBy: "u1",
		addedAt: "2026-11-18T09:05:00Z",
	},
	{
		id: "e3",
		ingredientId: "i3",
		name: "Milk",
		qty: 1,
		unit: "litre",
		checked: true,
		source: { kind: "manual" },
		addedBy: "u1",
		addedAt: "2026-11-18T09:10:00Z",
	},
];

export function ListPage() {
	return (
		<>
			<h1>Shopping list</h1>
			{entries.length === 0 ? (
				<p>Nothing to buy.</p>
			) : (
				<ul>
					{entries.map((entry) => (
						<ListEntry key={entry.id} entry={entry} />
					))}
				</ul>
			)}
		</>
	);
}

function ListEntry({ entry }: { entry: ShoppingEntry }) {
	return (
		<li>
			{entry.checked ? <s>{entry.name}</s> : entry.name} × {entry.qty}
			{entry.unit && ` ${entry.unit}`}
		</li>
	);
}
