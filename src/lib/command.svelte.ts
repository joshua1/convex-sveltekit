/**
 * convexCommand() — programmatic mutations/actions matching SvelteKit's RemoteCommand API.
 *
 * Usage:
 * ```ts
 * const removeTask = convexCommand(api.tasks.remove)
 * await removeTask({ id: task._id })
 * ```
 */
import type { FunctionReference, FunctionArgs, FunctionReturnType } from "convex/server"
import { getConvexClient } from "./client.svelte.js"
import type { ConvexQueryResult } from "./query.svelte.js"

export interface ConvexCommand<
  Ref extends FunctionReference<"mutation"> | FunctionReference<"action">,
> {
  /** Call the mutation/action */
  (args: FunctionArgs<Ref>): Promise<FunctionReturnType<Ref>> & {
    updates(
      ...queries: Array<
        ConvexQueryResult<FunctionReference<"query">> | { _key: string; release: () => void }
      >
    ): Promise<FunctionReturnType<Ref>>
  }
  /** Number of in-flight executions */
  readonly pending: number
}

/**
 * Create a callable command wrapping a Convex mutation or action.
 * Matches SvelteKit's RemoteCommand<Input, Output> pattern.
 */
export function convexCommand<
  Ref extends FunctionReference<"mutation"> | FunctionReference<"action">,
>(ref: Ref): ConvexCommand<Ref> {
  type Output = FunctionReturnType<Ref>

  let pendingCount = $state(0)

  const command = ((args: FunctionArgs<Ref>) => {
    pendingCount++

    const promise = (async () => {
      try {
        const client = getConvexClient()
        return (await client.mutation(ref as FunctionReference<"mutation">, args)) as Output
      } finally {
        pendingCount--
      }
    })() as Promise<Output> & {
      updates: (...queries: unknown[]) => Promise<Output>
    }

    // .updates() — release overrides after mutation completes (Convex auto-updates live queries)
    promise.updates = (...queries: unknown[]) => {
      return promise.finally(() => {
        for (const q of queries) {
          if (q && typeof q === "object" && "release" in q) {
            ;(q as { release: () => void }).release()
          }
        }
      }) as Promise<Output> & { updates: (...queries: unknown[]) => Promise<Output> }
    }

    return promise
  }) as ConvexCommand<Ref>

  Object.defineProperty(command, "pending", {
    get: () => pendingCount,
  })

  return command
}
