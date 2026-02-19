<script lang="ts">
  import type { Snippet } from "svelte"

  let { children }: { children: Snippet } = $props()
</script>

<div class="demo-page">
  {@render children()}
</div>

<style>
  .demo-page {
    max-width: 36rem;
    margin: 0 auto;
    padding: 1.5rem;
  }
</style>
