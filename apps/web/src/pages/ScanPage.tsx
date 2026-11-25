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
			return <p>Added {result.entry.name}</p>;
		case "incremented":
			return (
				<p>
					{result.entry.name}: {result.entry.qty} on the list
				</p>
			);
		case "unregistered":
			// The "What's this?" form replaces this in step 10.
			return <p>New tag. What's this?</p>;
	}
}
