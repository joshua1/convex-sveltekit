<script lang="ts">
  import { convexQuery } from "$lib/index.js"
  import { api } from "$convex/_generated/api"
  import TaskDemo from "../TaskDemo.svelte"

  const tasks = convexQuery(api.tasks.get, {})
</script>

<TaskDemo {tasks} mode="client" />
