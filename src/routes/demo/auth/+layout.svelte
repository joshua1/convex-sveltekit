<script lang="ts">
  import { setupConvexAuth } from "$lib/index.js"
  import { authClient } from "$demo/auth-client.js"
  import type { Snippet } from "svelte"

  let { data, children }: { data: { convexToken: string | null }; children: Snippet } = $props()

  setupConvexAuth({ authClient, initialToken: data.convexToken })
</script>

{@render children()}
