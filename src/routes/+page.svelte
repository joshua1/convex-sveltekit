<script lang="ts">
	const features = [
		{
			title: "convexQuery()",
			desc: "Live queries that auto-update via WebSocket. Drop-in replacement for useQuery.",
			color: "violet",
		},
		{
			title: "convexForm()",
			desc: "SvelteKit's form DX for Convex mutations. Spread, validate, enhance — no server hop.",
			color: "pink",
		},
		{
			title: "convexLoad()",
			desc: "SSR in load functions. Transport hook auto-upgrades to live on the client.",
			color: "emerald",
		},
		{
			title: "convexCommand()",
			desc: "Programmatic mutations matching SvelteKit's RemoteCommand pattern.",
			color: "amber",
		},
	]
</script>

<div class="min-h-screen bg-white">
	<!-- Hero -->
	<header class="mx-auto max-w-3xl px-6 pt-20 pb-16 text-center">
		<p class="mb-4 text-sm font-medium tracking-wide text-violet-600 uppercase">Experimental</p>
		<h1 class="mb-4 text-5xl font-extrabold tracking-tight text-neutral-900">convex-sveltekit</h1>
		<p class="mx-auto max-w-xl text-xl text-neutral-600">
			SvelteKit-native Convex integration.<br />
			Real-time queries. Form spreading. SSR-to-live transport.
		</p>
		<div class="mt-8 flex items-center justify-center gap-4">
			<a
				href="/demo"
				class="rounded-lg bg-violet-600 px-6 py-3 font-medium text-white shadow-sm hover:bg-violet-700"
			>
				Live demo
			</a>
			<a
				href="https://github.com/axel-rock/convex-sveltekit"
				class="rounded-lg border border-neutral-300 px-6 py-3 font-medium text-neutral-700 hover:bg-neutral-50"
			>
				GitHub
			</a>
		</div>
	</header>

	<!-- Before / After -->
	<section class="mx-auto max-w-4xl px-6 pb-20">
		<h2 class="mb-8 text-center text-2xl font-bold text-neutral-900">Before / After</h2>

		<div class="grid gap-6 md:grid-cols-2">
			<!-- Before -->
			<div class="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
				<div class="mb-3 flex items-center gap-2">
					<span class="rounded bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600">Before</span>
					<span class="text-sm text-neutral-500">convex-svelte + manual SSR</span>
				</div>
				<pre class="overflow-x-auto rounded-lg bg-neutral-900 p-4 text-sm text-neutral-100"><code><span class="text-neutral-500">// +page.server.ts</span>
<span class="text-pink-400">export const</span> load = <span class="text-pink-400">async</span> () =&gt; &#123;
  <span class="text-pink-400">const</span> client = <span class="text-pink-400">new</span> <span class="text-emerald-400">ConvexHttpClient</span>(url)
  <span class="text-pink-400">return</span> &#123;
    tasks: <span class="text-pink-400">await</span> client.<span class="text-amber-300">query</span>(api.tasks.get, &#123;&#125;)
  &#125;
&#125;

<span class="text-neutral-500">// +page.svelte</span>
<span class="text-pink-400">const</span> query = <span class="text-amber-300">useQuery</span>(
  api.tasks.get, &#123;&#125;,
  &#123; initialData: data.tasks &#125;
)
<span class="text-pink-400">const</span> tasks = <span class="text-violet-400">$derived</span>(
  query.data ?? data.tasks
)</code></pre>
			</div>

			<!-- After -->
			<div class="rounded-xl border-2 border-violet-200 bg-violet-50/50 p-6">
				<div class="mb-3 flex items-center gap-2">
					<span class="rounded bg-violet-200 px-2 py-0.5 text-xs font-medium text-violet-700">After</span>
					<span class="text-sm text-violet-600">convex-sveltekit</span>
				</div>
				<pre class="overflow-x-auto rounded-lg bg-neutral-900 p-4 text-sm text-neutral-100"><code><span class="text-neutral-500">// +page.ts</span>
<span class="text-pink-400">export const</span> load = () =&gt; (&#123;
  tasks: <span class="text-amber-300">convexLoad</span>(api.tasks.get, &#123;&#125;)
&#125;)

<span class="text-neutral-500">// +page.svelte</span>
<span class="text-pink-400">const</span> tasks = data.tasks
<span class="text-neutral-500">// Already live. That's it.</span></code></pre>
				<p class="mt-4 text-xs text-violet-600">
					SSR'd by the load function. Auto-upgraded to a real-time WebSocket subscription via SvelteKit's transport hook. Mutations update all live queries automatically.
				</p>
			</div>
		</div>

		<!-- Forms comparison -->
		<div class="mt-6 grid gap-6 md:grid-cols-2">
			<div class="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
				<div class="mb-3">
					<span class="rounded bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600">Before</span>
					<span class="ml-2 text-sm text-neutral-500">Manual mutation</span>
				</div>
				<pre class="overflow-x-auto rounded-lg bg-neutral-900 p-4 text-sm text-neutral-100"><code><span class="text-pink-400">const</span> client = <span class="text-amber-300">useConvexClient</span>()
<span class="text-pink-400">let</span> text = <span class="text-violet-400">$state</span>(<span class="text-emerald-400">""</span>)
<span class="text-pink-400">let</span> pending = <span class="text-violet-400">$state</span>(<span class="text-amber-300">false</span>)

<span class="text-pink-400">async function</span> <span class="text-amber-300">submit</span>() &#123;
  pending = <span class="text-amber-300">true</span>
  <span class="text-pink-400">await</span> client.<span class="text-amber-300">mutation</span>(
    api.tasks.create, &#123; text &#125;
  )
  text = <span class="text-emerald-400">""</span>; pending = <span class="text-amber-300">false</span>
&#125;</code></pre>
			</div>

			<div class="rounded-xl border-2 border-violet-200 bg-violet-50/50 p-6">
				<div class="mb-3">
					<span class="rounded bg-violet-200 px-2 py-0.5 text-xs font-medium text-violet-700">After</span>
					<span class="ml-2 text-sm text-violet-600">SvelteKit form DX</span>
				</div>
				<pre class="overflow-x-auto rounded-lg bg-neutral-900 p-4 text-sm text-neutral-100"><code><span class="text-pink-400">const</span> form = <span class="text-amber-300">convexForm</span>(
  z.object(&#123; text: z.string() &#125;),
  api.tasks.create
)

<span class="text-neutral-500">&lt;!-- Spread like SvelteKit forms --&gt;</span>
&lt;form &#123;...form&#125;&gt;
  &lt;input &#123;...form.fields.text.<span class="text-amber-300">as</span>(<span class="text-emerald-400">"text"</span>)&#125; /&gt;
  &lt;button&gt;Add&lt;/button&gt;
&lt;/form&gt;</code></pre>
			</div>
		</div>
	</section>

	<!-- Features -->
	<section class="border-t border-neutral-100 bg-neutral-50/50 py-20">
		<div class="mx-auto max-w-3xl px-6">
			<h2 class="mb-10 text-center text-2xl font-bold text-neutral-900">Features</h2>
			<div class="grid gap-6 sm:grid-cols-2">
				{#each features as f (f.title)}
					<div class="rounded-xl border border-neutral-200 bg-white p-6">
						<h3 class="mb-2 font-mono text-lg font-semibold text-neutral-900">{f.title}</h3>
						<p class="text-sm text-neutral-600">{f.desc}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- How it works -->
	<section class="mx-auto max-w-3xl px-6 py-20">
		<h2 class="mb-6 text-2xl font-bold text-neutral-900">How the transport magic works</h2>
		<ol class="space-y-4 text-neutral-700">
			<li class="flex gap-3">
				<span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">1</span>
				<p><code class="rounded bg-neutral-100 px-1.5 py-0.5 text-sm">convexLoad()</code> in your load function fetches data server-side via Convex's HTTP client.</p>
			</li>
			<li class="flex gap-3">
				<span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">2</span>
				<p>SvelteKit's <code class="rounded bg-neutral-100 px-1.5 py-0.5 text-sm">transport</code> hook serializes it across the SSR boundary.</p>
			</li>
			<li class="flex gap-3">
				<span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">3</span>
				<p>On the client, <code class="rounded bg-neutral-100 px-1.5 py-0.5 text-sm">transport.decode</code> auto-upgrades it to a live WebSocket subscription with the SSR data as initial state.</p>
			</li>
			<li class="flex gap-3">
				<span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">4</span>
				<p>Mutations trigger Convex to push updates to all live queries — no <code class="rounded bg-neutral-100 px-1.5 py-0.5 text-sm">.refresh()</code> needed.</p>
			</li>
		</ol>
	</section>

	<!-- Footer -->
	<footer class="border-t border-neutral-100 py-10 text-center text-sm text-neutral-500">
		<p>
			Built by <a href="https://github.com/axel-rock" class="underline hover:text-neutral-700">Axel Rock</a>
			&amp; <a href="https://claude.ai" class="underline hover:text-neutral-700">Claude Opus 4.6</a>.
			Inspired by <a href="https://github.com/get-convex/convex-svelte" class="underline hover:text-neutral-700">convex-svelte</a>.
			Battle-tested at <a href="https://cobl.ai" class="underline hover:text-neutral-700">Cobl</a>.
		</p>
	</footer>
</div>
