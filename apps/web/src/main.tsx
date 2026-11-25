import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router";
import { ListPage } from "./pages/ListPage";
import { ScanPage } from "./pages/ScanPage";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<BrowserRouter>
			<Routes>
				<Route path="/list" element={<ListPage />} />
				<Route path="/t/:tagId" element={<ScanPage />} />
			</Routes>
		</BrowserRouter>
	</StrictMode>,
);
