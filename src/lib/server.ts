/**
 * Server-side Convex client — for use in load functions, remote functions, and server hooks.
 * Uses ConvexHttpClient (stateless HTTP) instead of ConvexClient (WebSocket).
 */
import { ConvexHttpClient } from "convex/browser"
import type { FunctionReference, FunctionArgs, FunctionReturnType } from "convex/server"
import { getConvexUrl } from "./client.svelte.js"

let _httpClient: ConvexHttpClient | null = null

function getHttpClient(): ConvexHttpClient {
	if (!_httpClient) {
		_httpClient = new ConvexHttpClient(getConvexUrl())
	}
	return _httpClient
}

/** One-shot server-side query. Use in load functions or remote .ts files. */
export async function serverQuery<Query extends FunctionReference<"query">>(
	ref: Query,
	args: FunctionArgs<Query>,
): Promise<FunctionReturnType<Query>> {
	return getHttpClient().query(ref, args)
}

/** One-shot server-side mutation. Use in remote .ts files to wrap Convex mutations. */
export async function serverMutation<Mutation extends FunctionReference<"mutation">>(
	ref: Mutation,
	args: FunctionArgs<Mutation>,
): Promise<FunctionReturnType<Mutation>> {
	return getHttpClient().mutation(ref, args)
}

/** One-shot server-side action. Use in remote .ts files to wrap Convex actions. */
export async function serverAction<Action extends FunctionReference<"action">>(
	ref: Action,
	args: FunctionArgs<Action>,
): Promise<FunctionReturnType<Action>> {
	return getHttpClient().action(ref, args)
}
