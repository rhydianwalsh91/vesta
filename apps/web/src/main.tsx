import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router";
import { ListPage } from "./pages/ListPage";
import { ScanPage } from "./pages/ScanPage";

// One cache for the whole app; every useQuery reads from it.
const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<BrowserRouter>
				<Routes>
					<Route path="/list" element={<ListPage />} />
					<Route path="/t/:tagId" element={<ScanPage />} />
				</Routes>
			</BrowserRouter>
		</QueryClientProvider>
	</StrictMode>,
);
