<script lang="ts">
  import { invalidateAll } from "$app/navigation"
  import { authClient } from "$demo/auth-client.js"
  import { useConvexAuth } from "$lib/index.js"
  import { clearAuthCookies } from "./sign-out.remote.js"

  let { data } = $props()
  const auth = useConvexAuth()

  let mode = $state<"signin" | "signup">("signin")
  let name = $state("")
  let email = $state("")
  let password = $state("")
  let error = $state("")
  let loading = $state(false)
  let signingOut = $state(false)

  const source = $derived(!data.user ? null : auth.isAuthenticated ? "live" : "jwt")

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    error = ""
    loading = true

    try {
      if (mode === "signup") {
        const { error: err } = await authClient.signUp.email({ name, email, password })
        if (err) {
          error =
            err.status === 422 ? "Account already exists." : (err.message ?? "Sign up failed.")
          if (err.status === 422) mode = "signin"
          return
        }
      } else {
        const { error: err } = await authClient.signIn.email({ email, password })
        if (err) {
          error = "Invalid email or password."
          return
        }
      }
      await invalidateAll()
    } catch {
      error = "Something went wrong."
    } finally {
      loading = false
    }
  }

  async function signOut() {
    signingOut = true
    await authClient.signOut()
    await clearAuthCookies()
    window.location.reload()
  }
</script>

<svelte:head>
  <title>Auth demo — convex-sveltekit</title>
</svelte:head>

{#if data.user}
  <div class="profile">
    <div class="avatar">
      {#if data.user.image}
        <img src={data.user.image} alt="" />
      {:else}
        <span>{data.user.name?.[0]?.toUpperCase() ?? "?"}</span>
      {/if}
    </div>
    <h2>{data.user.name ?? "User"}</h2>
    <p class="email">{data.user.email ?? ""}</p>
    <span class="source" class:live={source === "live"}>
      {source === "live" ? "live subscription" : "jwt seed"}
    </span>
    <button onclick={signOut} class="btn-danger" disabled={signingOut}>
      {signingOut ? "Signing out..." : "Sign out"}
    </button>
  </div>

  <div class="how">
    <h3>What's happening</h3>
    <ul>
      <li>Server read the JWT cookie — zero network calls — and seeded <code>data.user</code></li>
      <li><code>convexUser()</code> wrapped it for the transport hook</li>
      <li>Client decoded it and subscribed to <code>api.auth.getCurrentUser</code></li>
      <li>
        Source shows <strong>jwt seed</strong> until the Convex subscription confirms, then
        <strong>live subscription</strong>
      </li>
      <li>No loading spinner — the page renders instantly from the cookie</li>
    </ul>
  </div>
{:else}
  <div class="auth-form">
    <h2>{mode === "signin" ? "Sign in" : "Create account"}</h2>

    <form onsubmit={handleSubmit}>
      {#if mode === "signup"}
        <input
          type="text"
          bind:value={name}
          placeholder="Name"
          required
          autocomplete="name"
          disabled={loading}
        />
      {/if}
      <input
        type="email"
        bind:value={email}
        placeholder="Email"
        required
        autocomplete="email"
        disabled={loading}
      />
      <input
        type="password"
        bind:value={password}
        placeholder="Password (min 8)"
        required
        minlength={8}
        autocomplete={mode === "signup" ? "new-password" : "current-password"}
        disabled={loading}
      />

      {#if error}
        <p class="error">{error}</p>
      {/if}

      <button type="submit" class="btn-submit" disabled={loading}>
        {loading ? "..." : mode === "signup" ? "Create account" : "Sign in"}
      </button>
    </form>

    <p class="toggle">
      {mode === "signin" ? "No account?" : "Already have one?"}
      <button
        type="button"
        onclick={() => {
          mode = mode === "signin" ? "signup" : "signin"
          error = ""
        }}
        class="link-btn"
      >
        {mode === "signin" ? "Sign up" : "Sign in"}
      </button>
    </p>
  </div>

  <div class="how">
    <h3>How it works</h3>
    <ul>
      <li>Better Auth runs inside Convex as an HTTP action</li>
      <li><code>/api/auth/*</code> proxy keeps cookies on the SvelteKit domain</li>
      <li>
        <code>handleAuth</code> reads the JWT cookie into <code>locals.convexToken</code> +
        <code>locals.user</code>
      </li>
      <li><code>setupConvexAuth(initialToken)</code> pre-authenticates the WebSocket — no flash</li>
      <li>
        <code>convexUser(locals.user)</code> seeds from JWT, auto-upgrades to live Convex subscription
      </li>
      <li>
        Full guide: <a href="https://github.com/axel-rock/convex-sveltekit/blob/main/BETTER_AUTH.md"
          >BETTER_AUTH.md</a
        >
      </li>
    </ul>
  </div>
{/if}

<style>
  /* Profile */
  .profile {
    text-align: center;
    padding: 2rem 0 1rem;
  }
  .avatar {
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    background: var(--bg-muted);
    border: 2px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 0.75rem;
    overflow: hidden;
  }
  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .avatar span {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-soft);
  }
  h2 {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 0.1rem;
  }
  .email {
    color: var(--text-soft);
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
  }
  .source {
    display: inline-block;
    font-size: 0.7rem;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    padding: 0.15rem 0.5rem;
    border-radius: 3px;
    background: var(--bg-muted);
    color: var(--text-muted);
    margin-bottom: 1rem;
    transition: all 0.3s;
  }
  .source.live {
    background: color-mix(in srgb, var(--success) 12%, transparent);
    color: var(--success);
  }
  .btn-danger {
    display: block;
    margin: 0 auto;
    padding: 0.45rem 1rem;
    background: var(--danger);
    color: #fff;
    border: none;
    border-radius: 4px;
    font-weight: 500;
    font-size: 0.85rem;
  }
  .btn-danger:hover:not(:disabled) {
    opacity: 0.9;
  }
  .btn-danger:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Auth form */
  .auth-form {
    max-width: 22rem;
    margin: 0 auto;
    padding: 2rem 0 0;
  }
  .auth-form h2 {
    margin-bottom: 1rem;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: var(--bg);
    font-size: 0.9rem;
  }
  input:focus {
    outline: 2px solid var(--accent);
    outline-offset: -1px;
  }
  .btn-submit {
    padding: 0.55rem;
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.9rem;
  }
  .btn-submit:hover:not(:disabled) {
    background: var(--accent-dim);
  }
  .btn-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .error {
    color: var(--danger);
    font-size: 0.85rem;
  }
  .toggle {
    margin-top: 1rem;
    text-align: center;
    color: var(--text-soft);
    font-size: 0.85rem;
  }
  .link-btn {
    background: none;
    border: none;
    color: var(--accent);
    font-weight: 600;
    font-size: inherit;
    padding: 0;
    cursor: pointer;
  }
  .link-btn:hover {
    text-decoration: underline;
  }

  /* How it works */
  .how {
    margin-top: 2rem;
    padding: 1rem;
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 0.85rem;
  }
  .how h3 {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-soft);
    margin-bottom: 0.5rem;
  }
  .how ul {
    padding-left: 1.25rem;
    color: var(--text-soft);
    line-height: 1.7;
  }
</style>
