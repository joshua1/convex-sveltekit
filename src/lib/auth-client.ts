/**
 * Better Auth client — configured for Convex integration.
 *
 * Auth API calls go to /api/auth/* on the same origin, proxied to
 * Convex site URL by src/routes/api/auth/[...all]/+server.ts.
 */
import { convexClient } from "@convex-dev/better-auth/client/plugins"
import { createAuthClient } from "better-auth/svelte"

export const authClient = createAuthClient({
  plugins: [convexClient()],
})
