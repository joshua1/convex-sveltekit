// Client lifecycle
export {
  initConvex,
  setupConvex,
  getConvexClient,
  getConvexUrl,
  useConvexClient,
} from "./client.svelte.js"

// Live queries
export { convexQuery, createDetachedQuery, type ConvexQueryResult } from "./query.svelte.js"

// Client-side forms (SvelteKit RemoteForm-compatible)
export { convexForm, type ConvexForm } from "./form.svelte.js"

// Programmatic mutations/actions (SvelteKit RemoteCommand-compatible)
export { convexCommand, type ConvexCommand } from "./command.svelte.js"

// SSR bridge
export {
  convexLoad,
  ConvexLoadResult,
  encodeConvexLoad,
  decodeConvexLoad,
} from "./transport.svelte.js"

// Server-side helpers (for .remote.ts and load functions)
export { serverQuery, serverMutation, serverAction } from "./server.js"

// Auth bridge (Better Auth ↔ Convex)
export { setupConvexAuth, useConvexAuth } from "./auth.svelte.js"
