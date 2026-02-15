/**
 * Better Auth ↔ Convex auth bridge.
 *
 * Wires Better Auth session tokens into the ConvexClient so all
 * Convex queries/mutations run as the authenticated user.
 *
 * Call `setupConvexAuth({ authClient })` in the root layout (after `setupConvex()`).
 * Read auth state anywhere via `useConvexAuth()`.
 */
import { createContext } from "svelte"
import { getConvexClient } from "./client.svelte.js"

// ============================================================================
// Types
// ============================================================================

/** Minimal type for the Better Auth client (avoids importing the full type). */
type AuthClient = {
  useSession: () => {
    subscribe: (
      cb: (state: { data: unknown; isPending: boolean }) => void,
    ) => (() => void) | { unsubscribe: () => void }
  }
  convex: { token: () => Promise<{ data: { token: string } | null }> }
}

type ConvexAuthState = {
  readonly isAuthenticated: boolean
  readonly isLoading: boolean
}

// ============================================================================
// Context
// ============================================================================

const [getAuthCtx, setAuthCtx] = createContext<ConvexAuthState>()

// ============================================================================
// Setup
// ============================================================================

/**
 * Wire Better Auth into the Convex client.
 * Must be called during component init (root layout), after `setupConvex()`.
 */
export function setupConvexAuth({ authClient }: { authClient: AuthClient }) {
  const client = getConvexClient()

  let sessionData: unknown = $state(null)
  let sessionPending = $state(true)
  let convexAuthed: boolean | null = $state(null)

  // Subscribe to Better Auth session state
  authClient.useSession().subscribe((session: { data: unknown; isPending: boolean }) => {
    sessionData = session.data
    sessionPending = session.isPending
  })

  const hasSession = $derived(sessionData !== null)

  const isAuthenticated = $derived(hasSession && (convexAuthed ?? false))
  const isLoading = $derived(sessionPending || (hasSession && convexAuthed === null))

  // Fetch a Convex-compatible JWT from Better Auth
  const fetchAccessToken = async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
    if (!forceRefreshToken) return null
    try {
      const { data } = await authClient.convex.token()
      return data?.token ?? null
    } catch {
      return null
    }
  }

  // Sync auth state: set/clear Convex auth when session changes
  $effect(() => {
    let active = true

    if (hasSession) {
      client.setAuth(fetchAccessToken, (isAuthed: boolean) => {
        if (active) convexAuthed = isAuthed
      })
    } else {
      client.client.clearAuth()
      convexAuthed = null
    }

    return () => {
      active = false
    }
  })

  setAuthCtx({
    get isAuthenticated() {
      return isAuthenticated
    },
    get isLoading() {
      return isLoading
    },
  })
}

// ============================================================================
// Hook
// ============================================================================

/** Read auth state. Must be called under a component tree with `setupConvexAuth`. */
export function useConvexAuth(): ConvexAuthState {
  return getAuthCtx()
}
