# convex-sveltekit

> SvelteKit-native Convex integration. Real-time queries, form spreading, SSR-to-live transport, user session bridge.

Based on [convex-sveltekit](https://github.com/axel-rock/convex-sveltekit). Vendored in `src/lib/convex/` for fast iteration.

---

## The problem

Convex gives you a real-time database. SvelteKit gives you the best full-stack DX in the JavaScript ecosystem. Using them together today means choosing: either you get Convex's live queries _or_ SvelteKit's SSR and form magic. Not both.

With `convex-svelte`, you get `useQuery` and that's about it. SSR means manually wiring `ConvexHttpClient` in load functions, passing `initialData`, and deriving the final value. Mutations mean calling `client.mutation()` by hand. No form spreading, no validation, no `pending` state.

## The solution

`convex-sveltekit` gives you both. SvelteKit's DX patterns — but powered by Convex's real-time engine.

### Before / After

**Reading data with SSR:**

```diff
- // +page.server.ts
- const client = new ConvexHttpClient(url)
- return { tasks: await client.query(api.tasks.get, {}) }
-
- // +page.svelte
- const query = useQuery(api.tasks.get, {}, { initialData: data.tasks })
- const tasks = $derived(query.data ?? data.tasks)

+ // +page.ts
+ export const load = () => ({
+   tasks: convexLoad(api.tasks.get, {})
+ })
+
+ // +page.svelte — data.tasks is already live
```

**Mutating data:**

```diff
- const client = useConvexClient()
- let text = $state("")
- let pending = $state(false)
- async function submit() {
-   pending = true
-   await client.mutation(api.tasks.create, { text })
-   text = ""; pending = false
- }

+ const form = convexForm(z.object({ text: z.string() }), api.tasks.create)
+
+ <form {...form}>
+   <input {...form.fields.text.as("text")} />
+   <button disabled={!!form.pending}>Add</button>
+ </form>
```

**User session (JWT → live):**

```diff
- // +layout.server.ts
- user: locals.user ?? null
-
- // +layout.svelte
- const auth = useConvexAuth()
- const userQuery = convexQuery(api.auth.getCurrentUser, () => auth.isAuthenticated ? {} : "skip")
- const user = $derived(userQuery.data ?? data.user)

+ // +layout.server.ts
+ user: convexUser(locals.user)
+
+ // +layout.svelte — data.user is reactive, auto-upgrades
```

No `.refresh()` needed. Convex mutations automatically push updates to all live queries.

## Features

### `convexQuery()` — live queries

Drop-in component-level query with auto-updating data via WebSocket.

```svelte
<script>
  import { convexQuery } from "$lib/convex"

  const tasks = convexQuery(api.tasks.get, {})
</script>

{#if tasks.isLoading}
  <p>Loading...</p>
{:else}
  {#each tasks.data ?? [] as task}
    <p>{task.text}</p>
  {/each}
{/if}
```

Supports conditional queries:

```ts
const user = convexQuery(api.users.get, () => (userId ? { id: userId } : "skip"))
```

### `convexLoad()` — SSR with automatic live upgrade

Use in SvelteKit load functions. Data is fetched server-side, then seamlessly upgraded to a live WebSocket subscription on the client via SvelteKit's `transport` hook.

```ts
// +page.ts
import { convexLoad } from "$lib/convex"

export const load = async () => ({
  tasks: await convexLoad(api.tasks.get, {}),
})
```

```svelte
<!-- +page.svelte — tasks is reactive, no extra wiring -->
<script>
  let { data } = $props()
</script>

{#each data.tasks.data ?? [] as task}
  <p>{task.text}</p>
{/each}
```

SvelteKit preloads it on link hover. Zero loading spinners. Then it's live.

### `convexUser()` — user session with SSR-to-live upgrade

Seeds the user from JWT claims (available instantly on the server), then upgrades to a live Convex subscription on the client. Profile images are preloaded before state swaps to prevent visual flicker.

```ts
// +layout.server.ts
import { convexUser } from "$lib/convex"

export const load = async ({ locals }) => ({
  user: convexUser(locals.user),
})
```

```svelte
<!-- +layout.svelte — data.user is reactive, auto-upgrades to Convex data -->
<script>
  let { data } = $props()
  const user = $derived(data.user)
</script>

<AppSidebar {user} />
```

How it works:

1. **Server:** `convexUser()` wraps the JWT-decoded user in a `ConvexUserResult` marker. Properties are copied onto the instance via `Object.assign` so SSR template access works normally.
2. **Transport:** `encodeConvexUser` serializes the user fields. `decodeConvexUser` creates a reactive proxy backed by `$state`.
3. **Client:** The proxy subscribes to a Convex query (configured in `hooks.ts`). Null results are ignored (unauthenticated cold start before `setupConvexAuth`). When the authenticated query resolves, state updates.
4. **Image preloading:** If the Convex user has a new `image` URL (e.g. Google profile picture not in the JWT), the image is preloaded via `new Image()` before updating state — no flicker.

Transport hook configuration (in `hooks.ts`):

```ts
import { encodeConvexUser, decodeConvexUser } from "$lib/convex"
import { api } from "$convex/_generated/api"

export const transport = {
  // ...ConvexLoadResult...
  ConvexUserResult: {
    encode: (v) => encodeConvexUser(v),
    decode: (e) => decodeConvexUser(e, api.auth.getCurrentUser, {}),
  },
}
```

The query ref is passed at the transport level, keeping the `convexUser()` function generic.

### `convexForm()` — SvelteKit form DX for Convex mutations

Matches the API of SvelteKit's `RemoteForm`. Spread onto `<form>`, get field bindings, validation, pending state — but calls Convex mutations directly (no server hop).

```svelte
<script>
  import { convexForm } from "$lib/convex"
  import { z } from "zod"

  const createTask = convexForm(z.object({ text: z.string().min(1) }), api.tasks.create)
</script>

<form {...createTask}>
  <input {...createTask.fields.text.as("text")} />

  {#each createTask.fields.text.issues?.() ?? [] as issue}
    <span class="error">{issue.message}</span>
  {/each}

  <button disabled={!!createTask.pending}>
    {createTask.pending ? "Adding..." : "Add"}
  </button>
</form>
```

Features:

- **Form spreading** — `{...form}` attaches submit handler via `createAttachmentKey`
- **Field bindings** — `.fields.name.as("text")` returns typed input attributes
- **Validation** — Zod (or any Standard Schema) for client-side validation
- **`.for(id)`** — parameterized instances for lists
- **`.enhance()`** — custom submit lifecycle
- **`.pending`** — in-flight mutation count

### `convexCommand()` — programmatic mutations

For mutations that don't need a form.

```ts
const removeTask = convexCommand(api.tasks.remove)
await removeTask({ id: task._id })
```

## How the transport works

1. `convexLoad()` in your load function fetches data server-side via `ConvexHttpClient`
2. SvelteKit's `transport` hook serializes the result across the SSR boundary
3. On the client, `transport.decode` creates a live WebSocket subscription with the SSR data as initial state
4. On client-side navigation, `convexLoad()` detects the browser and creates the subscription directly
5. Mutations trigger Convex to push updates to **all** live queries — no `.refresh()` needed

This means: SSR for first paint, preloading on hover, instant navigation, then real-time forever.

### User transport variant

`convexUser()` follows the same pattern but seeds from external data (JWT) instead of a Convex HTTP query:

1. `convexUser(locals.user)` wraps JWT data in `ConvexUserResult`
2. Transport encode strips the marker, sends plain user fields
3. Transport decode creates a reactive `$state` proxy + live Convex subscription
4. Null results ignored (pre-auth), image URLs preloaded before state swap

## Setup

### 1. Initialize in hooks (early, for transport)

```ts
// src/hooks.client.ts
import { initConvex } from "$lib/convex"
initConvex(PUBLIC_CONVEX_URL)
```

### 2. Set up context in root layout

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import { setupConvex } from "$lib/convex"
  setupConvex(PUBLIC_CONVEX_URL)
</script>
```

### 3. Add transport hook (for SSR)

```ts
// src/hooks.ts
import { encodeConvexLoad, decodeConvexLoad, encodeConvexUser, decodeConvexUser } from "$lib/convex"
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

### 4. Use it

```svelte
<script>
  import { convexQuery, convexForm } from "$lib/convex"
  import { api } from "$convex/_generated/api"
  import { z } from "zod"

  const tasks = convexQuery(api.tasks.get, {})
  const addTask = convexForm(z.object({ text: z.string() }), api.tasks.create)
</script>
```

## API

| Function                          | Purpose                                 |
| --------------------------------- | --------------------------------------- |
| `initConvex(url)`                 | Early client init (hooks.client.ts)     |
| `setupConvex(url)`                | Layout init (context + cleanup)         |
| `setupConvexAuth(opts)`           | Wire Better Auth into Convex client     |
| `useConvexAuth()`                 | Read auth state (isAuthenticated, etc.) |
| `convexQuery(ref, args, opts?)`   | Live query in components                |
| `convexLoad(ref, args)`           | SSR query in load functions             |
| `convexUser(data)`                | User session with SSR-to-live upgrade   |
| `convexForm(schema, mutationRef)` | Form with SvelteKit DX                  |
| `convexCommand(ref)`              | Programmatic mutation/action            |
| `getConvexClient()`               | Raw client access (escape hatch)        |
| `useConvexClient()`               | Client from Svelte context              |
| `serverQuery(ref, args)`          | Server-side one-shot query              |
| `serverMutation(ref, args)`       | Server-side one-shot mutation           |
| `serverAction(ref, args)`         | Server-side one-shot action             |

## File structure

```
src/lib/convex/
├── client.svelte.ts      # ConvexClient lifecycle (singleton + context)
├── query.svelte.ts       # convexQuery() + createDetachedQuery()
├── transport.svelte.ts   # convexLoad() + ConvexLoadResult encode/decode
├── user.svelte.ts        # convexUser() + ConvexUserResult encode/decode
├── form.svelte.ts        # convexForm() (RemoteForm-compatible)
├── command.svelte.ts     # convexCommand() (RemoteCommand-compatible)
├── auth.svelte.ts        # setupConvexAuth() + useConvexAuth()
├── server.ts             # serverQuery/serverMutation/serverAction
└── index.ts              # Public exports
```

## Credits

Built by [Axel Rock](https://github.com/axel-rock).

Inspired by [convex-svelte](https://github.com/get-convex/convex-svelte) by the Convex team.
