<script lang="ts">
  import TaskDemo from "./TaskDemo.svelte"

  let { data } = $props()
  const tasks = $derived(data.tasks)
</script>

<TaskDemo {tasks} mode="server" />
