# convex-sveltekit

> SvelteKit-native Convex integration. Real-time queries, form spreading, SSR-to-live transport.

**Status:** Experimental — actively being tested. Expect breaking changes.

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

No `.refresh()` needed. Convex mutations automatically push updates to all live queries.

## Features

### `convexQuery()` — live queries

Drop-in component-level query with auto-updating data via WebSocket.

```svelte
<script>
  import { convexQuery } from "convex-sveltekit"

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
import { convexLoad } from "convex-sveltekit"

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

### `convexForm()` — SvelteKit form DX for Convex mutations

Matches the API of SvelteKit's `RemoteForm`. Spread onto `<form>`, get field bindings, validation, pending state — but calls Convex mutations directly (no server hop).

```svelte
<script>
  import { convexForm } from "convex-sveltekit"
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

### `convexCommand()` — programmatic mutations/actions

For mutations (or actions) that don't need a form. Pass `"action"` as second arg for Convex actions.

```ts
const removeTask = convexCommand(api.tasks.remove)
await removeTask({ id: task._id })

const generate = convexCommand(api.ai.generate, "action")
await generate({ prompt: "..." })
```

### `setupConvexAuth()` — Better Auth integration

Wires [Better Auth](https://www.better-auth.com/) sessions into the Convex client. Pass `initialToken` from SSR to pre-authenticate the WebSocket before any subscription fires — prevents unauthenticated query flashes.

```svelte
<!-- +layout.svelte -->
<script>
  import { setupConvex, setupConvexAuth } from "convex-sveltekit"

  let { data } = $props()
  setupConvex(PUBLIC_CONVEX_URL)
  setupConvexAuth({ authClient, initialToken: data.convexToken })
</script>
```

Read auth state anywhere with `useConvexAuth()`:

```ts
const auth = useConvexAuth()
// auth.isAuthenticated, auth.isLoading
```

### `convexUser()` — SSR-to-live user data

Seeds user data from JWT claims on the server, then upgrades to a live Convex subscription on the client. Preloads profile images before swapping state to prevent flicker.

```ts
// +layout.server.ts
import { convexUser } from "convex-sveltekit"

export const load = async ({ locals }) => ({
  user: convexUser(locals.user),
})
```

```svelte
<!-- +layout.svelte — data.user is reactive, auto-upgrades to Convex data -->
<AppSidebar user={data.user} />
```

## How the transport works

1. `convexLoad()` in your load function fetches data server-side via `ConvexHttpClient`
2. SvelteKit's `transport` hook serializes the result across the SSR boundary
3. On the client, `transport.decode` creates a live WebSocket subscription with the SSR data as initial state
4. On client-side navigation, `convexLoad()` detects the browser and creates the subscription directly
5. Mutations trigger Convex to push updates to **all** live queries — no `.refresh()` needed

This means: SSR for first paint, preloading on hover, instant navigation, then real-time forever.

## Quick start

```bash
npm install convex-sveltekit convex
```

### 1. Initialize in hooks (early, for transport)

```ts
// src/hooks.client.ts
import { initConvex } from "convex-sveltekit"
import { PUBLIC_CONVEX_URL } from "$env/static/public"

initConvex(PUBLIC_CONVEX_URL)
// With auth: initConvex(PUBLIC_CONVEX_URL, {}, initialToken)
```

### 2. Set up context in root layout

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import { setupConvex } from "convex-sveltekit"
  setupConvex(PUBLIC_CONVEX_URL)
</script>
```

### 3. Add transport hook (for SSR)

```ts
// src/hooks.ts
import { encodeConvexLoad, decodeConvexLoad } from "convex-sveltekit"

export const transport = {
  ConvexLoadResult: {
    encode: (value) => encodeConvexLoad(value),
    decode: (encoded) => decodeConvexLoad(encoded),
  },
}
```

### 4. Use it

```svelte
<script>
  import { convexQuery, convexForm } from "convex-sveltekit"
  import { api } from "$convex/_generated/api"
  import { z } from "zod"

  const tasks = convexQuery(api.tasks.get, {})
  const addTask = convexForm(z.object({ text: z.string() }), api.tasks.create)
</script>
```

## API

| Function                              | Purpose                                 |
| ------------------------------------- | --------------------------------------- |
| `initConvex(url, opts?, token?)`      | Early client init (hooks.client.ts)     |
| `setupConvex(url)`                    | Layout init (context + cleanup)         |
| `convexQuery(ref, args, opts?)`       | Live query in components                |
| `convexLoad(ref, args)`              | SSR query in load functions             |
| `convexForm(schema, mutationRef)`     | Form with SvelteKit DX                  |
| `convexCommand(ref, type?)`           | Programmatic mutation/action            |
| `setupConvexAuth({ authClient, ... })`| Better Auth ↔ Convex bridge             |
| `useConvexAuth()`                     | Read auth state (isAuthenticated, etc.) |
| `convexUser(data)`                    | SSR-to-live user data transport         |
| `getConvexClient()`                   | Raw client access (escape hatch)        |
| `useConvexClient()`                   | Client from Svelte context              |
| `serverQuery(ref, args)`             | Server-side one-shot query              |
| `serverMutation(ref, args)`          | Server-side one-shot mutation           |
| `serverAction(ref, args)`            | Server-side one-shot action             |

## Roadmap

- [x] Auth token forwarding (Better Auth)
- [ ] Paginated query support (`usePaginatedQuery` equivalent)
- [ ] Test suite
- [ ] Optimized cleanup for detached queries
- [ ] File upload integration

## Credits

Built by [Axel Rock](https://github.com/axel-rock).

Inspired by [convex-svelte](https://github.com/get-convex/convex-svelte) by the Convex team.

## License

MIT
