import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ScanResult } from "@vesta/shared";
import { useEffect, useRef, useState } from "react";
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
			{isError && (
				<p className="error" role="alert">
					Couldn't scan this tag.
				</p>
			)}
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
			return <RegisterForm tagId={result.tagId} />;
	}
}

// Registering doesn't add to the list: when writing a batch of tags you
// aren't out of anything yet. The next scan adds it.
function RegisterForm({ tagId }: { tagId: string }) {
	const [name, setName] = useState("");
	const [location, setLocation] = useState("");
	const { mutate, data, isPending, error } = useMutation({
		mutationFn: async () => {
			const res = await client.api.tags[":tagId"].assign.$post({
				param: { tagId },
				// The API rejects an empty location, so leave it out instead.
				json: { name, location: location.trim() || undefined },
			});
			if (res.status === 409) {
				throw new Error("This tag is already registered.");
			}
			if (!res.ok) throw new Error("Couldn't save this tag.");
			return res.json();
		},
	});

	if (data)
		return <p>Saved {data.name}. Scan it again to add it to the list.</p>;

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				mutate();
			}}
		>
			<p>New tag. What's this?</p>
			<label>
				Name
				<input
					value={name}
					onChange={(e) => setName(e.target.value)}
					required
				/>
			</label>
			<label>
				Location (optional)
				<input
					value={location}
					onChange={(e) => setLocation(e.target.value)}
					placeholder="e.g. cupboard"
				/>
			</label>
			<button type="submit" disabled={isPending}>
				Save
			</button>
			{error && (
				<p className="error" role="alert">
					{error.message}
				</p>
			)}
		</form>
	);
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
			{isError && (
				<p className="error" role="alert">
					Couldn't undo.
				</p>
			)}
		</>
	);
}
