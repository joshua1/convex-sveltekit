<script lang="ts">
	import { PUBLIC_CONVEX_URL } from "$env/static/public"
	import { setupConvex } from "$lib/index.js"
	import type { Snippet } from "svelte"
	import "../app.css"

	setupConvex(PUBLIC_CONVEX_URL)

	let { children }: { children: Snippet } = $props()
</script>

<svelte:head>
	<title>convex-sveltekit</title>
	<meta name="description" content="SvelteKit-native Convex integration" />
</svelte:head>

{@render children()}
