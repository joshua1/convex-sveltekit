<script lang="ts">
  import { page } from "$app/state"
  import type { Snippet } from "svelte"

  let { children }: { children: Snippet } = $props()

  const tabs = [
    { href: "/demo/client", label: "Client-side", desc: "convexQuery()" },
    { href: "/demo/server", label: "Server-side", desc: "convexLoad()" },
  ] as const
</script>

<div class="demo-page">
  <div class="demo-header">
    <a href="/">&larr; Home</a>
    <h1>Live demo</h1>
  </div>
  <p class="demo-intro">
    Same data, two fetching strategies. Navigate between tabs to feel the difference.
  </p>

  <nav class="tabs">
    {#each tabs as tab (tab.href)}
      {@const active = page.url.pathname === tab.href}
      <a href={tab.href} class="tab" class:active data-sveltekit-preload-data="hover">
        <span class="tab-label">{tab.label}</span>
        <span class="tab-desc">{tab.desc}</span>
      </a>
    {/each}
  </nav>

  {@render children()}
</div>

<style>
  .demo-page {
    max-width: 36rem;
    margin: 0 auto;
    padding: 2.5rem 1.5rem;
  }
  .demo-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.25rem;
  }
  .demo-header a {
    font-size: 0.85rem;
    color: var(--text-muted);
  }
  .demo-header h1 {
    font-size: 1.4rem;
    font-weight: 600;
  }
  .demo-intro {
    font-size: 0.85rem;
    color: var(--text-soft);
    margin-bottom: 1.5rem;
  }
  .tabs {
    display: flex;
    gap: 2px;
    background: var(--bg-muted);
    padding: 3px;
    border-radius: 4px;
    margin-bottom: 1.5rem;
  }
  .tab {
    flex: 1;
    text-align: center;
    padding: 0.5rem 1rem;
    border-radius: 3px;
    text-decoration: none;
    color: var(--text-soft);
    font-size: 0.85rem;
    font-weight: 500;
  }
  .tab:hover {
    text-decoration: none;
    color: var(--text);
  }
  .tab.active {
    background: var(--bg);
    color: var(--accent);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
  .tab-label {
    display: block;
  }
  .tab-desc {
    display: block;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 0.65rem;
    opacity: 0.7;
  }
</style>
