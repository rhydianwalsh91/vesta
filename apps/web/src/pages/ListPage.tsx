import { useQuery } from "@tanstack/react-query";
import type { ShoppingEntry } from "@vesta/shared";
import { client } from "../api";

// The Hono client doesn't throw on 4xx/5xx, so do it here or Query would
// treat an error body as the list.
async function fetchList() {
	const res = await client.api.list.$get();
	if (!res.ok) throw new Error(`GET /api/list failed: ${res.status}`);
	return res.json();
}

export function ListPage() {
	const {
		data: entries,
		isPending,
		isError,
	} = useQuery({ queryKey: ["list"], queryFn: fetchList });

	return (
		<>
			<h1>Shopping list</h1>
			{isPending && <p>Loading…</p>}
			{isError && <p>Couldn't load the list.</p>}
			{entries?.length === 0 && <p>Nothing to buy.</p>}
			{entries && entries.length > 0 && (
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
