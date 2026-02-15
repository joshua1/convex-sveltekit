<script lang="ts">
	import { page } from "$app/state"
	import type { Snippet } from "svelte"

	let { children }: { children: Snippet } = $props()

	const tabs = [
		{ href: "/demo/client", label: "Client-side", desc: "convexQuery()" },
		{ href: "/demo/server", label: "Server-side", desc: "convexLoad()" },
	] as const
</script>

<div class="mx-auto max-w-xl px-6 py-12">
	<div class="mb-2 flex items-center gap-3">
		<a href="/" class="text-sm text-neutral-400 hover:text-neutral-600">&larr; Home</a>
		<h1 class="text-2xl font-bold text-neutral-900">Live demo</h1>
	</div>
	<p class="mb-6 text-sm text-neutral-500">
		Same data, two fetching strategies. Navigate between tabs to feel the difference.
	</p>

	<nav class="mb-6 flex gap-1 rounded-lg bg-neutral-100 p-1">
		{#each tabs as tab (tab.href)}
			{@const active = page.url.pathname === tab.href}
			<a
				href={tab.href}
				class="flex-1 rounded-md px-4 py-2 text-center text-sm font-medium transition-all"
				class:bg-white={active}
				class:shadow-sm={active}
				class:text-violet-700={active}
				class:text-neutral-500={!active}
				class:hover:text-neutral-700={!active}
				data-sveltekit-preload-data="hover"
			>
				<span class="block">{tab.label}</span>
				<span class="block font-mono text-[10px]" class:text-violet-500={active} class:text-neutral-400={!active}>
					{tab.desc}
				</span>
			</a>
		{/each}
	</nav>

	{@render children()}
</div>
