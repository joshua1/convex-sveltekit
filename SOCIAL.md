# Social posts — convex-sveltekit launch

Review, tweak, post when ready. Order matters — BlueSky first (SK community lives there), then X.

---

## BlueSky thread (SvelteKit community, Rich Harris)

### Post 1 — The hook

I built something for the 12 people who use both SvelteKit and Convex.

SvelteKit's transport hook + Convex's real-time queries = SSR that auto-upgrades to live WebSocket subscriptions.

One line in your load function. Zero loading spinners. Data is just... live.

github.com/axel-rock/convex-sveltekit

### Post 2 — The technical flex

How it works:

1. `convexLoad()` fetches via HTTP in your load function (SSR, preloading — all the SvelteKit magic)
2. SvelteKit's `transport` hook serializes it across the SSR boundary
3. `transport.decode` on the client creates a live Convex subscription with the SSR data as initial state

No `useQuery` + `initialData` + `$derived` dance. Just data that's already there and already live.

### Post 3 — The forms

And yes, Convex mutations with SvelteKit's form DX:

```
const form = convexForm(z.object({ text: z.string() }), api.tasks.create)

<form {...form}>
  <input {...form.fields.text.as("text")} />
</form>
```

Same spread pattern as SvelteKit's remote forms. Uses `createAttachmentKey` under the hood. No server hop — calls the Convex mutation directly.

### Post 4 — The story (optional, personal)

This idea has been in my head for months. Every night I'd think "there has to be a way to make Convex feel native in SvelteKit."

Built it in one session with Claude Opus 4.6. Now battle-testing it at @cobl.

It's experimental. It's probably broken in 15 ways. But the DX is exactly what I wanted.

---

## X posts (Convex team, Ben Davis)

### Post 1 — Announcement

New: convex-sveltekit — SvelteKit-native Convex integration.

- Live queries via `convexQuery()`
- SSR-to-live via SvelteKit's transport hook
- Form spreading a la SvelteKit remote functions
- Mutations auto-update all live queries (no .refresh())

Demo: [link]
Repo: github.com/axel-rock/convex-sveltekit

@convaboratory

### Post 2 — Tag people

Made this for the small but passionate intersection of @convex_dev and SvelteKit users.

@BenDavisYT @mmailaender — thought you'd want to see this.

Experimental, battle-tested at @cobl. Feedback welcome.

### Post 3 — The Venn diagram (optional, fun)

[Image: Venn diagram]
Left circle: "SvelteKit enjoyers"
Right circle: "Convex believers"
Center overlap: "convex-sveltekit"
Below: "Population: 12. But we're loud."

---

## Notes

- Don't post all at once. BlueSky thread first. X a few hours later.
- The BlueSky thread should be the "technical storytelling" angle — this is where Rich Harris and SK core team will see it.
- The X posts are more "announcement" style — this is where Convex team and content creators will see it.
- If the thread gets traction, follow up with a short demo video (screen recording of the client vs server tab comparison).
