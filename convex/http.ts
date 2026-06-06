import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";

const http = httpRouter();

// cors: true — the Vite SPA calls these cross-domain (Convex .site URL).
authComponent.registerRoutes(http, createAuth, { cors: true });

export default http;
