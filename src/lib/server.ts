/**
 * Server-side Convex client — for use in load functions, remote functions, and server hooks.
 * Uses ConvexHttpClient (stateless HTTP) instead of ConvexClient (WebSocket).
 *
 * Auth-aware: reads `event.locals.convexToken` from the current request context
 * via SvelteKit's `getRequestEvent()`. Authenticated requests use a per-request
 * client to avoid cross-request token leakage.
 */
import { ConvexHttpClient } from "convex/browser"
import type { FunctionReference, FunctionArgs, FunctionReturnType } from "convex/server"
import { getConvexUrl } from "./client.svelte.js"

let _httpClient: ConvexHttpClient | null = null

/** Unauthenticated singleton — reused for public queries. */
function getUnauthenticatedClient(): ConvexHttpClient {
  if (!_httpClient) {
    _httpClient = new ConvexHttpClient(getConvexUrl())
  }
  return _httpClient
}

/**
 * Get auth token from the current SvelteKit request context.
 * Uses dynamic import() — $app/server is a Vite virtual module, require() won't resolve it.
 */
async function getTokenFromRequest(): Promise<string | null> {
  try {
    const { getRequestEvent } = await import("$app/server")
    const event = getRequestEvent()
    return event?.locals?.convexToken ?? null
  } catch {
    return null
  }
}

/** Get an auth-aware HTTP client for the current request. */
async function getHttpClient(): Promise<ConvexHttpClient> {
  const token = await getTokenFromRequest()
  if (token) {
    const client = new ConvexHttpClient(getConvexUrl())
    client.setAuth(token)
    return client
  }
  return getUnauthenticatedClient()
}

/** One-shot server-side query. Auth-aware via request context. */
export async function serverQuery<Query extends FunctionReference<"query">>(
  ref: Query,
  args: FunctionArgs<Query>,
): Promise<FunctionReturnType<Query>> {
  return (await getHttpClient()).query(ref, args)
}

/** One-shot server-side mutation. Auth-aware via request context. */
export async function serverMutation<Mutation extends FunctionReference<"mutation">>(
  ref: Mutation,
  args: FunctionArgs<Mutation>,
): Promise<FunctionReturnType<Mutation>> {
  return (await getHttpClient()).mutation(ref, args)
}

/** One-shot server-side action. Auth-aware via request context. */
export async function serverAction<Action extends FunctionReference<"action">>(
  ref: Action,
  args: FunctionArgs<Action>,
): Promise<FunctionReturnType<Action>> {
  return (await getHttpClient()).action(ref, args)
}
