import { createMemoryHistory, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routes";

// Create a memory-based history (no URL path routing)
const memoryHistory = createMemoryHistory({
  initialEntries: ["/"],
});

// Create the router instance
export const router = createRouter({
  routeTree,
  history: memoryHistory,
});

// Register router types for TypeScript
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
