# Better Auth Integration

Authentication for Convex + SvelteKit using [Better Auth](https://www.better-auth.com/) and [`@convex-dev/better-auth`](https://github.com/get-convex/better-auth).

> **Alternative:** If you'd prefer a batteries-included adapter with ready-made UI components (shadcn-style), check out [`convex-better-auth-svelte`](https://github.com/mmailaender/convex-better-auth-svelte) by [@mmailaender](https://github.com/mmailaender) and the companion [Convex Better Auth UI](https://github.com/mmailaender/Convex-Better-Auth-UI). That project does excellent work making Convex auth accessible in Svelte — highly recommended if you want to get up and running fast without wiring everything yourself. The guide below is for when you want full control over the integration, or you're already using `convex-sveltekit` for queries/forms and want auth to fit the same patterns.

> **SSR note:** Using `.server.ts` load files (instead of `.ts`) for authenticated data currently eliminates rendering flicker completely. Universal `.ts` load files work but may show a brief flash while the client-side token syncs.

---

## How it works

Better Auth runs as an HTTP action inside your Convex deployment. A SvelteKit proxy route keeps auth cookies on your domain so the server can read them for SSR.

```
Browser  ──POST /api/auth/*──>  SvelteKit proxy  ──>  Convex site URL (Better Auth)
                                     │
                              Set-Cookie (SvelteKit domain)
                                     │
Next request ──cookie──>  hooks.server.ts reads JWT
                          → locals.convexToken (for serverQuery/convexLoad)
                          → locals.user (decoded JWT for SSR templates)
                                     │
Layout  ──convexToken──>  setupConvexAuth({ initialToken })
                          → ConvexClient pre-authenticated on first paint
```

---

## Setup

### 1. Install

```bash
pnpm add better-auth@1.4.9 @convex-dev/better-auth
```

Pin `better-auth` to `1.4.9` — it's the version `@convex-dev/better-auth` is built against.

### 2. Convex-side

**Register the component** — `src/convex/convex.config.ts`

```ts
import { defineApp } from "convex/server"
import betterAuth from "@convex-dev/better-auth/convex.config"

const app = defineApp()
app.use(betterAuth)

export default app
```

**Auth config** — `src/convex/auth.config.ts`

```ts
import { getAuthConfigProvider } from "@convex-dev/better-auth/auth-config"
import type { AuthConfig } from "convex/server"

export default {
  providers: [getAuthConfigProvider()],
} satisfies AuthConfig
```

**Better Auth instance + queries** — `src/convex/auth.ts`

```ts
import { createClient, type GenericCtx } from "@convex-dev/better-auth"
import { convex } from "@convex-dev/better-auth/plugins"
import { betterAuth } from "better-auth"
import type { BetterAuthOptions } from "better-auth"
import { components } from "./_generated/api"
import type { DataModel } from "./_generated/dataModel"
import { query } from "./_generated/server"
import authConfig from "./auth.config"

const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL as string

export const authComponent = createClient<DataModel>(components.betterAuth)

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  return {
    appName: "My App",
    baseURL: BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    database: authComponent.adapter(ctx),
    emailAndPassword: { enabled: true },
    plugins: [
      convex({
        authConfig,
        jwt: {
          definePayload: ({ user }) => ({
            name: user.name,
            email: user.email,
            image: user.image,
          }),
        },
      }),
    ],
  } satisfies BetterAuthOptions
}

export const createAuth = (ctx: GenericCtx<DataModel>) => betterAuth(createAuthOptions(ctx))

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const raw = await authComponent.safeGetAuthUser(ctx)
    if (!raw) return null
    return {
      id: raw._id,
      email: raw.email ?? "",
      name: raw.name ?? "",
      image: raw.image ?? null,
    }
  },
})
```

**HTTP routes** — `src/convex/http.ts`

```ts
import { httpRouter } from "convex/server"
import { authComponent, createAuth } from "./auth"

const http = httpRouter()
authComponent.registerRoutes(http, createAuth)

export default http
```

**Environment variables** (Convex dashboard or CLI):

```bash
npx convex env set BETTER_AUTH_SECRET "$(openssl rand -base64 32)"
npx convex env set BETTER_AUTH_URL "http://localhost:5173"  # your SvelteKit origin
```

### 3. SvelteKit-side

**Auth proxy** — `src/routes/api/auth/[...all]/+server.ts`

Proxies `/api/auth/*` to the Convex site URL so cookies land on your SvelteKit domain.

```ts
import { PUBLIC_CONVEX_SITE_URL } from "$env/static/public"
import type { RequestHandler } from "./$types"

const proxy: RequestHandler = async ({ request }) => {
  const url = new URL(request.url)
  const target = `${PUBLIC_CONVEX_SITE_URL}${url.pathname}${url.search}`

  const proxyRequest = new Request(target, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    // @ts-expect-error needed for streaming request bodies
    duplex: "half",
  })
  proxyRequest.headers.set("accept-encoding", "application/json")

  return fetch(proxyRequest, { redirect: "manual" })
}

export const GET = proxy
export const POST = proxy
```

**Server auth handle** — `src/lib/auth.server.ts`

Reads the JWT cookie and populates `event.locals`. Zero network calls.

```ts
import type { Handle } from "@sveltejs/kit"

const JWT_COOKIE = "better-auth.convex_jwt"

export const handleAuth: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get(JWT_COOKIE) ?? event.cookies.get(`__Secure-${JWT_COOKIE}`)

  if (token) {
    event.locals.convexToken = token

    try {
      const payload = JSON.parse(atob(token.split(".")[1]!))
      event.locals.user = {
        id: payload.sub,
        email: payload.email ?? "",
        name: payload.name ?? "",
        image: payload.image ?? null,
      }
    } catch {
      // Malformed JWT — token still set for Convex queries to validate
    }
  }

  return resolve(event)
}
```

**Hooks** — `src/hooks.server.ts`

```ts
import { sequence } from "@sveltejs/kit/hooks"
import { PUBLIC_CONVEX_URL } from "$env/static/public"
import { initConvex } from "convex-sveltekit"
import { handleAuth } from "$lib/auth.server.js"

initConvex(PUBLIC_CONVEX_URL)

export const handle = sequence(handleAuth)
```

**Better Auth client** — `src/lib/auth-client.ts`

```ts
import { convexClient } from "@convex-dev/better-auth/client/plugins"
import { createAuthClient } from "better-auth/svelte"

export const authClient = createAuthClient({
  plugins: [convexClient()],
})
```

**App types** — `src/app.d.ts`

```ts
declare global {
  namespace App {
    interface Locals {
      convexToken?: string
      user?: {
        id: string
        email: string
        name: string
        image?: string | null
      }
    }
  }
}

export {}
```

### 4. Wire auth into layout

**Server load** — `src/routes/+layout.server.ts`

```ts
import { convexUser } from "convex-sveltekit"

export const load = async ({ locals }) => ({
  convexToken: locals.convexToken ?? null,
  user: convexUser(locals.user),
})
```

**Layout component** — `src/routes/+layout.svelte`

```svelte
<script>
  import { setupConvex, setupConvexAuth } from "convex-sveltekit"
  import { authClient } from "$lib/auth-client.js"

  let { data, children } = $props()

  setupConvex(PUBLIC_CONVEX_URL)
  setupConvexAuth({ authClient, initialToken: data.convexToken })
</script>

{@render children()}
```

**Transport hook** — `src/hooks.ts`

Add the `ConvexUserResult` transport alongside `ConvexLoadResult`:

```ts
import {
  encodeConvexLoad, decodeConvexLoad,
  encodeConvexUser, decodeConvexUser,
} from "convex-sveltekit"
import { api } from "$convex/_generated/api"

export const transport = {
  ConvexLoadResult: {
    encode: (value) => encodeConvexLoad(value),
    decode: (encoded) => decodeConvexLoad(encoded),
  },
  ConvexUserResult: {
    encode: (value) => encodeConvexUser(value),
    decode: (encoded) => decodeConvexUser(encoded, api.auth.getCurrentUser, {}),
  },
}
```

### 5. `.env.local`

Add `PUBLIC_CONVEX_SITE_URL` (same as your Convex URL but `.site` instead of `.cloud`):

```
PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
PUBLIC_CONVEX_SITE_URL=https://your-deployment.convex.site
```

---

## Usage

### Reading auth state

```ts
import { useConvexAuth } from "convex-sveltekit"

const auth = useConvexAuth()
// auth.isAuthenticated, auth.isLoading
```

### Conditional queries

```ts
const user = convexQuery(api.auth.getCurrentUser, () => (auth.isAuthenticated ? {} : "skip"))
```

### Server-side authenticated queries

`serverQuery` / `serverMutation` / `serverAction` automatically read `locals.convexToken`:

```ts
// +page.server.ts
import { serverQuery } from "convex-sveltekit"

export const load = async () => ({
  user: await serverQuery(api.auth.getCurrentUser, {}),
})
```

### SSR-to-live user data

`convexUser()` seeds from the JWT on the server, then upgrades to a live Convex subscription on the client:

```ts
// +layout.server.ts
export const load = async ({ locals }) => ({
  user: convexUser(locals.user),
})
```

```svelte
<!-- +layout.svelte — data.user is reactive, auto-upgrades to live Convex data -->
<p>{data.user?.name}</p>
```

### Sign in / sign up

```ts
import { authClient } from "$lib/auth-client.js"

// Sign up
await authClient.signUp.email({ name, email, password })

// Sign in
await authClient.signIn.email({ email, password })

// Sign out
await authClient.signOut()
```

### Social providers

Add provider credentials as Convex env vars and extend `createAuthOptions`:

```ts
socialProviders: {
  github: {
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  },
},
```

And on the client:

```ts
await authClient.signIn.social({ provider: "github", callbackURL: "/" })
```

---

## Working example

This repository's demo app includes a working Better Auth integration with email/password:

- `src/convex/auth.ts` — Better Auth config + `getCurrentUser` query
- `src/convex/http.ts` — route registration
- `src/lib/auth-client.ts` — client instance
- `src/lib/auth.server.ts` — server handle
- `src/routes/login/` — sign in / sign up page
- `src/routes/profile/` — authenticated profile with `convexUser()` demo
- `src/routes/api/auth/[...all]/` — auth proxy

---

## Reference

| `convex-sveltekit` function | Purpose |
| --- | --- |
| `setupConvexAuth({ authClient, initialToken })` | Wire Better Auth sessions into ConvexClient |
| `useConvexAuth()` | Read `{ isAuthenticated, isLoading }` |
| `convexUser(data)` | SSR-to-live user transport (seeds from JWT, upgrades to Convex subscription) |
| `encodeConvexUser` / `decodeConvexUser` | Transport hooks for `ConvexUserResult` |
| `serverQuery` / `serverMutation` / `serverAction` | Auto-authenticated via `locals.convexToken` |
