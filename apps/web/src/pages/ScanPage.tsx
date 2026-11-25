import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ScanResult } from "@vesta/shared";
import { useEffect, useRef } from "react";
import { Link, useParams } from "react-router";
import { client } from "../api";

export function ScanPage() {
	const { tagId } = useParams();
	const queryClient = useQueryClient();
	const { mutate, data, isPending, isError } = useMutation({
		mutationFn: async (tagId: string) => {
			const res = await client.api.scan[":tagId"].$post({ param: { tagId } });
			if (!res.ok) throw new Error(`POST /api/scan failed: ${res.status}`);
			return res.json();
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["list"] }),
	});

	// StrictMode runs effects twice in dev. The ref survives that, so it stops
	// a double scan; keyed by tagId so moving to another tag still scans it.
	const scannedTag = useRef<string>(undefined);
	useEffect(() => {
		if (!tagId || scannedTag.current === tagId) return;
		scannedTag.current = tagId;
		mutate(tagId);
	}, [tagId, mutate]);

	return (
		<>
			<h1>Scan</h1>
			{isPending && <p>Scanning…</p>}
			{isError && <p>Couldn't scan this tag.</p>}
			{data && <ScanMessage result={data} />}
			<Link to="/list">View list</Link>
		</>
	);
}

function ScanMessage({ result }: { result: ScanResult }) {
	switch (result.result) {
		case "added":
			return (
				<>
					<p>Added {result.entry.name}</p>
					<UndoButton scanned={result} />
				</>
			);
		case "incremented":
			return (
				<>
					<p>
						{result.entry.name}: {result.entry.qty} on the list
					</p>
					<UndoButton scanned={result} />
				</>
			);
		case "unregistered":
			// The "What's this?" form replaces this in step 10.
			return <p>New tag. What's this?</p>;
	}
}

type ScannedResult = Exclude<ScanResult, { result: "unregistered" }>;

function UndoButton({ scanned }: { scanned: ScannedResult }) {
	const queryClient = useQueryClient();
	const { mutate, isPending, isSuccess, isError } = useMutation({
		// ponytail: undo sets qty absolutely, so a scan by someone else in between
		// is lost, and the "scanned" event stays in the log. Add a server-side
		// undo (with an "unscanned" event) when Phase 5 reads stats from events.
		mutationFn: async () => {
			const param = { entryId: scanned.entry.id };
			const res =
				scanned.result === "added"
					? await client.api.list.entries[":entryId"].$delete({ param })
					: await client.api.list.entries[":entryId"].$patch({
							param,
							json: { qty: scanned.entry.qty - 1 },
						});
			if (!res.ok) throw new Error(`Undo failed: ${res.status}`);
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["list"] }),
	});

	if (isSuccess) return <p>Undone.</p>;
	return (
		<>
			<button type="button" disabled={isPending} onClick={() => mutate()}>
				Undo
			</button>
			{isError && <p>Couldn't undo.</p>}
		</>
	);
}
