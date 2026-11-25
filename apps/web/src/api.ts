import type { AppType } from "@vesta/api";
import { hc } from "hono/client";

// Same origin everywhere: Vite's proxy in dev, Hono serving the app in production.
export const client = hc<AppType>("/");
