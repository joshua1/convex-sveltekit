<script lang="ts">
  import { PUBLIC_CONVEX_URL } from "$env/static/public"
  import { setupConvex } from "$lib/index.js"
  import type { Snippet } from "svelte"
  import "../app.css"

  setupConvex(PUBLIC_CONVEX_URL)

  let { children }: { children: Snippet } = $props()

  const pms = [
    { id: "npm", cmd: "npm install convex-sveltekit convex" },
    { id: "pnpm", cmd: "pnpm add convex-sveltekit convex" },
    { id: "yarn", cmd: "yarn add convex-sveltekit convex" },
    { id: "bun", cmd: "bun add convex-sveltekit convex" },
  ] as const

  let activePm = $state<string>("npm")
  let copied = $state(false)

  function copyCmd() {
    const cmd = pms.find((p) => p.id === activePm)!.cmd
    navigator.clipboard.writeText(cmd)
    copied = true
    setTimeout(() => (copied = false), 1500)
  }
</script>

<svelte:head>
  <title>convex-sveltekit</title>
  <meta
    name="description"
    content="SvelteKit-native Convex integration with real-time queries, form spreading, and SSR-to-live transport."
  />
</svelte:head>

<article>
  <!-- Hero -->
  <header>
    <small>Experimental</small>
    <h1>convex-sveltekit</h1>
    <p>
      SvelteKit-native Convex integration.<br />
      Real-time queries. Form spreading. SSR-to-live transport.
    </p>
    <nav>
      <a href="#demo" class="btn-primary">Live demo</a>
      <a href="https://github.com/axel-rock/convex-sveltekit" class="btn-outline">GitHub</a>
    </nav>
  </header>

  <!-- Install -->
  <section id="install">
    <div class="install-tabs">
      {#each pms as pm (pm.id)}
        <button
          class="install-tab"
          class:active={activePm === pm.id}
          onclick={() => (activePm = pm.id)}
        >
          {pm.id}
        </button>
      {/each}
    </div>
    <div class="install-cmd">
      <code>{pms.find((p) => p.id === activePm)!.cmd}</code>
      <button class="install-copy" onclick={copyCmd} aria-label="Copy to clipboard">
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  </section>

  <!-- Before / After -->
  <section id="comparison">
    <h2>Before / After</h2>

    <div class="grid">
      <figure>
        <figcaption>
          <mark>Before</mark>
          <span>convex-svelte + manual SSR</span>
        </figcaption>
        <pre><code
            ><span class="c-comment">// +page.server.ts</span>
<span class="c-kw">export const</span> load = <span class="c-kw">async</span> () =&gt; &#123;
  <span class="c-kw">const</span> client = <span class="c-kw">new</span> <span class="c-fn"
              >ConvexHttpClient</span
            >(url)
  <span class="c-kw">return</span> &#123;
    tasks: <span class="c-kw">await</span> client.<span class="c-fn">query</span
            >(api.tasks.get, &#123;&#125;)
  &#125;
&#125;

<span class="c-comment">// +page.svelte</span>
<span class="c-kw">const</span> query = <span class="c-fn">useQuery</span>(
  api.tasks.get, &#123;&#125;,
  &#123; initialData: data.tasks &#125;
)
<span class="c-kw">const</span> tasks = <span class="c-rune">$derived</span>(
  query.data ?? data.tasks
)</code
          ></pre>
      </figure>

      <figure data-accent>
        <figcaption>
          <mark>After</mark>
          <span>convex-sveltekit</span>
        </figcaption>
        <pre><code
            ><span class="c-comment">// +page.ts</span>
<span class="c-kw">export const</span> load = () =&gt; (&#123;
  tasks: <span class="c-fn">convexLoad</span>(api.tasks.get, &#123;&#125;)
&#125;)

<span class="c-comment">// +page.svelte</span>
<span class="c-kw">const</span> tasks = data.tasks
<span class="c-comment">// Already live. That's it.</span></code
          ></pre>
        <p>
          SSR'd by the load function. Auto-upgraded to real-time WebSocket via SvelteKit's transport
          hook.
        </p>
      </figure>
    </div>

    <div class="grid">
      <figure>
        <figcaption>
          <mark>Before</mark>
          <span>Manual mutation</span>
        </figcaption>
        <pre><code
            ><span class="c-kw">const</span> client = <span class="c-fn">useConvexClient</span>()
<span class="c-kw">let</span> text = <span class="c-rune">$state</span>(<span class="c-str">""</span
            >)
<span class="c-kw">let</span> pending = <span class="c-rune">$state</span>(<span class="c-lit"
              >false</span
            >)

<span class="c-kw">async function</span> <span class="c-fn">submit</span>() &#123;
  pending = <span class="c-lit">true</span>
  <span class="c-kw">await</span> client.<span class="c-fn">mutation</span>(
    api.tasks.create, &#123; text &#125;
  )
  text = <span class="c-str">""</span>; pending = <span class="c-lit">false</span>
&#125;

<span class="c-comment">&lt;!-- Wire it all up manually --&gt;</span>
&lt;form <span class="c-fn">onsubmit</span>=&#123;submit&#125;&gt;
  &lt;input <span class="c-fn">bind</span>:value=&#123;text&#125; /&gt;
  &lt;button disabled=&#123;pending&#125;&gt;Add&lt;/button&gt;
&lt;/form&gt;</code
          ></pre>
      </figure>

      <figure data-accent>
        <figcaption>
          <mark>After</mark>
          <span>SvelteKit form DX</span>
        </figcaption>
        <pre><code
            ><span class="c-kw">const</span> form = <span class="c-fn">convexForm</span>(
  z.object(&#123; text: z.string() &#125;),
  api.tasks.create
)

<span class="c-comment">&lt;!-- Spread like SvelteKit forms --&gt;</span>
&lt;form &#123;...form&#125;&gt;
  &lt;input &#123;...form.fields.text.<span class="c-fn">as</span>(<span class="c-str">"text"</span
            >)&#125; /&gt;
  &lt;button&gt;Add&lt;/button&gt;
&lt;/form&gt;</code
          ></pre>
      </figure>
    </div>
  </section>

  <!-- Features -->
  <section id="features">
    <h2>Features</h2>
    <div class="grid">
      {#each [["convexQuery()", "Live queries that auto-update via WebSocket. Drop-in replacement for useQuery."], ["convexForm()", "SvelteKit's form DX for Convex mutations. Spread, validate, enhance — no server hop."], ["convexLoad()", "SSR in load functions. Transport hook auto-upgrades to live on the client."], ["convexCommand()", "Programmatic mutations and actions matching SvelteKit's RemoteCommand pattern."], ["setupConvexAuth()", "Better Auth integration with SSR token seeding. No unauthenticated flashes."], ["convexUser()", "SSR-to-live user data. Seeds from JWT, upgrades to Convex subscription."]] as [title, desc], i (i)}
        <div>
          <h3>{title}</h3>
          <p>{desc}</p>
        </div>
      {/each}
    </div>
  </section>

  <!-- Live demo — child route renders here -->
  <section id="demo">
    <h2>Live demo</h2>
    <p>
      Try it — add, toggle, delete tasks. This is a real Convex backend. Data resets every 5
      minutes.
    </p>

    {@render children()}
  </section>

  <!-- How it works -->
  <section id="transport">
    <h2>How the transport works</h2>
    <ol>
      <li>
        <span>1</span>
        <p>
          <code>convexLoad()</code> in your load function fetches data server-side via Convex's HTTP client.
        </p>
      </li>
      <li>
        <span>2</span>
        <p>
          SvelteKit's <code>transport</code> hook serializes it across the SSR boundary.
        </p>
      </li>
      <li>
        <span>3</span>
        <p>
          On the client, <code>transport.decode</code> auto-upgrades to a live WebSocket subscription
          with SSR data as initial state.
        </p>
      </li>
      <li>
        <span>4</span>
        <p>
          Mutations trigger Convex to push updates to all live queries — no <code>.refresh()</code> needed.
        </p>
      </li>
    </ol>
  </section>

  <footer>
    <p>
      Built by <a href="https://github.com/axel-rock">Axel Rock</a> and Claude Opus 4.6. Inspired by
      <a href="https://github.com/get-convex/convex-svelte">convex-svelte</a>.
    </p>
  </footer>
</article>

<style>
  article {
    max-width: 52rem;
    margin: 0 auto;
    padding: 0 1.5rem;
  }

  /* Hero */
  article > header {
    padding: 4rem 0 3rem;
    text-align: center;
  }
  article > header > small {
    display: block;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--accent);
    margin-bottom: 0.75rem;
  }
  article > header h1 {
    font-size: clamp(2rem, 5vw, 3rem);
    font-weight: 700;
    letter-spacing: -0.02em;
    margin-bottom: 0.5rem;
  }
  article > header > p {
    color: var(--text-soft);
    max-width: 28rem;
    margin: 0 auto;
  }
  article > header > nav {
    margin-top: 1.5rem;
    display: flex;
    gap: 0.75rem;
    justify-content: center;
  }

  /* Buttons */
  .btn-primary {
    display: inline-block;
    background: var(--accent);
    color: #fff;
    padding: 0.5rem 1.25rem;
    border: none;
    border-radius: 4px;
    font-weight: 500;
    text-decoration: none;
  }
  .btn-primary:hover {
    background: var(--accent-dim);
    text-decoration: none;
  }
  .btn-outline {
    display: inline-block;
    padding: 0.5rem 1.25rem;
    border: 1px solid var(--border);
    border-radius: 4px;
    font-weight: 500;
    color: var(--text);
    text-decoration: none;
  }
  .btn-outline:hover {
    background: var(--bg-soft);
    text-decoration: none;
  }

  /* Install */
  #install {
    max-width: 28rem;
    margin: 0 auto;
    padding: 0 0 2rem;
  }
  .install-tabs {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--border);
  }
  .install-tab {
    padding: 0.4rem 1rem;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--text-muted);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
  }
  .install-tab:hover {
    color: var(--text);
  }
  .install-tab.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
  }
  .install-cmd {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-top: none;
    border-radius: 0 0 6px 6px;
    padding: 0.75rem 1rem;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 0.875rem;
  }
  .install-cmd code {
    overflow-x: auto;
    white-space: nowrap;
  }
  .install-copy {
    flex-shrink: 0;
    background: none;
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 0.2rem 0.6rem;
    font-size: 0.75rem;
    color: var(--text-soft);
    cursor: pointer;
  }
  .install-copy:hover {
    background: var(--bg-muted);
    color: var(--text);
  }

  /* Sections */
  article > section {
    padding: 3rem 0;
  }
  article > section > h2 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
  }
  article > section > p {
    color: var(--text-soft);
    margin-top: -1rem;
    margin-bottom: 1.5rem;
  }

  #features {
    background: var(--bg-soft);
    margin: 0 -1.5rem;
    padding: 3rem;
    border-top: 1px solid var(--border-soft);
    border-bottom: 1px solid var(--border-soft);
  }

  /* Grid */
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  #comparison .grid {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
  .grid + .grid {
    margin-top: 1rem;
  }
  @media (max-width: 640px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }

  /* Comparison figures */
  #comparison figure {
    min-width: 0;
    border: 1px solid var(--border);
    background: var(--bg);
    padding: 1.25rem;
    border-radius: 4px;
  }
  #comparison figure[data-accent] {
    border-color: var(--accent);
  }
  #comparison figcaption {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }
  #comparison mark {
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.1rem 0.5rem;
    background: var(--bg-muted);
    color: var(--text-soft);
    border-radius: 3px;
  }
  #comparison figure[data-accent] mark {
    background: color-mix(in srgb, var(--accent) 15%, transparent);
    color: var(--accent);
  }
  #comparison figcaption > span {
    color: var(--text-muted);
  }
  #comparison figure[data-accent] figcaption > span {
    color: var(--accent);
  }
  #comparison figure[data-accent] > p {
    margin-top: 0.75rem;
    color: var(--accent);
  }
  #comparison pre {
    overflow-x: auto;
  }

  /* Code highlighting */
  .c-comment {
    color: #666;
  }
  .c-kw {
    color: #f472b6;
  }
  .c-fn {
    color: #fbbf24;
  }
  .c-str {
    color: #6ee7b7;
  }
  .c-rune {
    color: #a78bfa;
  }
  .c-lit {
    color: #fbbf24;
  }

  /* Features */
  #features .grid > div {
    border: 1px solid var(--border);
    background: var(--bg);
    padding: 1.25rem;
    border-radius: 4px;
  }
  #features h3 {
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }
  #features p {
    color: var(--text-soft);
  }

  /* Steps */
  #transport ol {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  #transport li {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
  }
  #transport li > span {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    flex-shrink: 0;
    font-weight: 600;
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 10%, transparent);
    border-radius: 50%;
    margin-top: 0.1rem;
  }
  #transport li > p {
    color: var(--text-soft);
  }

  /* Footer */
  footer {
    padding: 2.5rem 0;
    border-top: 1px solid var(--border-soft);
    text-align: center;
    color: var(--text-muted);
  }
</style>
