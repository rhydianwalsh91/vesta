import { useParams } from "react-router";

export function ScanPage() {
	const { tagId } = useParams();
	return (
		<>
			<h1>Scan</h1>
			<p>Tag: {tagId}</p>
		</>
	);
}
