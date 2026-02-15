<script lang="ts">
	import { page } from "$app/state"
	import { goto } from "$app/navigation"
	import { convexQuery, convexForm, convexCommand } from "$lib/index.js"
	import { api } from "$convex/_generated/api"
	import { z } from "zod"

	const demoTab = $derived(page.url.searchParams.get("tab") === "server" ? "server" : "client")

	function setTab(tab: "client" | "server") {
		const url = new URL(page.url)
		if (tab === "client") {
			url.searchParams.delete("tab")
		} else {
			url.searchParams.set("tab", tab)
		}
		url.hash = "demo"
		goto(url, { replaceState: true, noScroll: true })
	}

	const tasks = convexQuery(api.tasks.get, {})
	const createTask = convexForm(z.object({ text: z.string().min(1) }), api.tasks.create)
	const removeTask = convexCommand(api.tasks.remove)
	const toggleTask = convexCommand(api.tasks.toggleComplete)
</script>

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

	<!-- Before / After -->
	<section id="comparison">
		<h2>Before / After</h2>

		<div class="grid">
			<figure>
				<figcaption>
					<mark>Before</mark>
					<span>convex-svelte + manual SSR</span>
				</figcaption>
				<pre><code><span class="c-comment">// +page.server.ts</span>
<span class="c-kw">export const</span> load = <span class="c-kw">async</span> () =&gt; &#123;
  <span class="c-kw">const</span> client = <span class="c-kw">new</span> <span class="c-fn">ConvexHttpClient</span>(url)
  <span class="c-kw">return</span> &#123;
    tasks: <span class="c-kw">await</span> client.<span class="c-fn">query</span>(api.tasks.get, &#123;&#125;)
  &#125;
&#125;

<span class="c-comment">// +page.svelte</span>
<span class="c-kw">const</span> query = <span class="c-fn">useQuery</span>(
  api.tasks.get, &#123;&#125;,
  &#123; initialData: data.tasks &#125;
)
<span class="c-kw">const</span> tasks = <span class="c-rune">$derived</span>(
  query.data ?? data.tasks
)</code></pre>
			</figure>

			<figure data-accent>
				<figcaption>
					<mark>After</mark>
					<span>convex-sveltekit</span>
				</figcaption>
				<pre><code><span class="c-comment">// +page.ts</span>
<span class="c-kw">export const</span> load = () =&gt; (&#123;
  tasks: <span class="c-fn">convexLoad</span>(api.tasks.get, &#123;&#125;)
&#125;)

<span class="c-comment">// +page.svelte</span>
<span class="c-kw">const</span> tasks = data.tasks
<span class="c-comment">// Already live. That's it.</span></code></pre>
				<p>
					SSR'd by the load function. Auto-upgraded to real-time WebSocket via SvelteKit's transport hook.
				</p>
			</figure>
		</div>

		<div class="grid">
			<figure>
				<figcaption>
					<mark>Before</mark>
					<span>Manual mutation</span>
				</figcaption>
				<pre><code><span class="c-kw">const</span> client = <span class="c-fn">useConvexClient</span>()
<span class="c-kw">let</span> text = <span class="c-rune">$state</span>(<span class="c-str">""</span>)
<span class="c-kw">let</span> pending = <span class="c-rune">$state</span>(<span class="c-lit">false</span>)

<span class="c-kw">async function</span> <span class="c-fn">submit</span>() &#123;
  pending = <span class="c-lit">true</span>
  <span class="c-kw">await</span> client.<span class="c-fn">mutation</span>(
    api.tasks.create, &#123; text &#125;
  )
  text = <span class="c-str">""</span>; pending = <span class="c-lit">false</span>
&#125;</code></pre>
			</figure>

			<figure data-accent>
				<figcaption>
					<mark>After</mark>
					<span>SvelteKit form DX</span>
				</figcaption>
				<pre><code><span class="c-kw">const</span> form = <span class="c-fn">convexForm</span>(
  z.object(&#123; text: z.string() &#125;),
  api.tasks.create
)

<span class="c-comment">&lt;!-- Spread like SvelteKit forms --&gt;</span>
&lt;form &#123;...form&#125;&gt;
  &lt;input &#123;...form.fields.text.<span class="c-fn">as</span>(<span class="c-str">"text"</span>)&#125; /&gt;
  &lt;button&gt;Add&lt;/button&gt;
&lt;/form&gt;</code></pre>
			</figure>
		</div>
	</section>

	<!-- Features -->
	<section id="features">
		<h2>Features</h2>
		<div class="grid">
			{#each [
				["convexQuery()", "Live queries that auto-update via WebSocket. Drop-in replacement for useQuery."],
				["convexForm()", "SvelteKit's form DX for Convex mutations. Spread, validate, enhance — no server hop."],
				["convexLoad()", "SSR in load functions. Transport hook auto-upgrades to live on the client."],
				["convexCommand()", "Programmatic mutations matching SvelteKit's RemoteCommand pattern."],
			] as [title, desc]}
				<div>
					<h3>{title}</h3>
					<p>{desc}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- Live demo -->
	<section id="demo">
		<h2>Live demo</h2>
		<p>
			Try it — add, toggle, delete tasks. This is a real Convex backend. Data resets every 5 minutes.
		</p>

		<div class="demo">
			<nav>
				<button
					aria-pressed={demoTab === "client"}
					onclick={() => setTab("client")}
				>
					Client-side
					<small>convexQuery()</small>
				</button>
				<button
					aria-pressed={demoTab === "server"}
					onclick={() => setTab("server")}
				>
					Server-side
					<small>convexLoad()</small>
				</button>
			</nav>

			{#if demoTab === "client"}
				<aside data-variant="accent">
					<strong>Client-side:</strong> Data fetched via WebSocket after mount. Brief loading state on first load.
				</aside>
			{:else}
				<aside data-variant="success">
					<strong>Server-side:</strong> Data fetched in load function. No spinner — SvelteKit preloads it. Then auto-upgrades to live.
				</aside>
			{/if}

			<form {...createTask}>
				<input
					{...createTask.fields.text.as("text")}
					placeholder="Add a task..."
					autocomplete="off"
				/>
				<button type="submit" disabled={!!createTask.pending}>
					{createTask.pending ? "Adding..." : "Add"}
				</button>
			</form>

			{#if tasks.isLoading}
				<div class="loading">
					<span class="spinner"></span>
					Connecting to Convex...
				</div>
			{:else if tasks.error}
				<p class="error">Error: {tasks.error.message}</p>
			{:else}
				<ul>
					{#each tasks.data ?? [] as task (task._id)}
						<li>
							<label>
								<input
									type="checkbox"
									checked={task.isCompleted}
									onchange={() => toggleTask({ id: task._id })}
									disabled={!!toggleTask.pending}
								/>
								<span class:completed={task.isCompleted}>{task.text}</span>
							</label>
							<button
								onclick={() => removeTask({ id: task._id })}
								disabled={!!removeTask.pending}
								aria-label="Delete task"
								class="delete"
							>
								&times;
							</button>
						</li>
					{/each}
				</ul>
				{#if (tasks.data ?? []).length === 0}
					<p class="empty">No tasks yet. Add one above!</p>
				{/if}
			{/if}

			<output>
				mode: <span class={demoTab === "client" ? "accent" : "success"}>{demoTab}</span> · items: {tasks.data?.length ?? 0} · live via WebSocket
			</output>
		</div>
	</section>

	<!-- How it works -->
	<section id="transport">
		<h2>How the transport works</h2>
		<ol>
			<li>
				<span>1</span>
				<p><code>convexLoad()</code> in your load function fetches data server-side via Convex's HTTP client.</p>
			</li>
			<li>
				<span>2</span>
				<p>SvelteKit's <code>transport</code> hook serializes it across the SSR boundary.</p>
			</li>
			<li>
				<span>3</span>
				<p>On the client, <code>transport.decode</code> auto-upgrades to a live WebSocket subscription with SSR data as initial state.</p>
			</li>
			<li>
				<span>4</span>
				<p>Mutations trigger Convex to push updates to all live queries — no <code>.refresh()</code> needed.</p>
			</li>
		</ol>
	</section>

	<footer>
		<p>
			Built by <a href="https://github.com/axel-rock">Axel Rock</a> and Claude Opus 4.6.
			Inspired by <a href="https://github.com/get-convex/convex-svelte">convex-svelte</a>.
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

	/* Code highlighting */
	.c-comment { color: #666; }
	.c-kw { color: #f472b6; }
	.c-fn { color: #fbbf24; }
	.c-str { color: #6ee7b7; }
	.c-rune { color: #a78bfa; }
	.c-lit { color: #fbbf24; }

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

	/* Demo box */
	.demo {
		border: 1px solid var(--border);
		border-radius: 4px;
		padding: 1.5rem;
		background: var(--bg);
	}

	/* Demo tabs */
	.demo > nav {
		display: flex;
		gap: 2px;
		background: var(--bg-muted);
		padding: 3px;
		border-radius: 4px;
		margin-bottom: 1rem;
	}
	.demo > nav > button {
		flex: 1;
		text-align: center;
		padding: 0.4rem 0.75rem;
		border-radius: 3px;
		border: none;
		background: none;
		color: var(--text-soft);
		font-weight: 500;
	}
	.demo > nav > button:hover {
		color: var(--text);
	}
	.demo > nav > button[aria-pressed="true"] {
		background: var(--bg);
		color: var(--accent);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	}
	.demo > nav > button > small {
		display: block;
		font-family: ui-monospace, "SF Mono", Menlo, monospace;
		font-size: 0.75em;
		opacity: 0.7;
	}

	/* Demo notice */
	.demo > aside {
		padding: 0.5rem 0.75rem;
		border-radius: 3px;
		margin-bottom: 1rem;
	}
	.demo > aside[data-variant="accent"] {
		background: color-mix(in srgb, var(--accent) 8%, var(--bg));
		color: var(--accent);
		border: 1px solid color-mix(in srgb, var(--accent) 20%, transparent);
	}
	.demo > aside[data-variant="success"] {
		background: color-mix(in srgb, var(--success) 8%, var(--bg));
		color: var(--success);
		border: 1px solid color-mix(in srgb, var(--success) 20%, transparent);
	}

	/* Demo form */
	.demo > form {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}
	.demo > form > input {
		flex: 1;
		padding: 0.4rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: 3px;
		background: var(--bg);
	}
	.demo > form > input:focus {
		outline: 2px solid var(--accent);
		outline-offset: -1px;
		border-color: transparent;
	}
	.demo > form > button {
		background: var(--accent);
		color: #fff;
		padding: 0.4rem 1rem;
		border: none;
		border-radius: 3px;
		font-weight: 500;
	}
	.demo > form > button:hover { background: var(--accent-dim); }
	.demo > form > button:disabled { opacity: 0.5; }

	/* Loading / error / empty */
	.loading {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 2rem 0;
		justify-content: center;
		color: var(--text-muted);
	}
	.spinner {
		display: inline-block;
		width: 1rem;
		height: 1rem;
		border: 2px solid var(--border);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	.error { color: var(--danger); }
	.empty {
		text-align: center;
		color: var(--text-muted);
		padding: 2rem 0;
	}

	/* Task list */
	.demo > ul {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.demo > ul > li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 0.5rem;
		border-radius: 3px;
	}
	.demo > ul > li:hover {
		background: var(--bg-soft);
	}
	.demo > ul label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
		cursor: pointer;
	}
	.demo > ul input[type="checkbox"] {
		accent-color: var(--accent);
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
		cursor: pointer;
	}
	.demo > ul .completed {
		text-decoration: line-through;
		color: var(--text-muted);
	}
	.demo > ul .delete {
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: 1.25rem;
		padding: 0 0.25rem;
		line-height: 1;
	}
	.demo > ul .delete:hover {
		color: var(--danger);
	}

	/* Demo status */
	.demo > output {
		display: block;
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--border-soft);
		font-size: 0.875rem;
		font-family: ui-monospace, "SF Mono", Menlo, monospace;
		color: var(--text-muted);
	}
	.accent { color: var(--accent); }
	.success { color: var(--success); }

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
