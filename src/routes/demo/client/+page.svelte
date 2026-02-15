<script lang="ts">
	import { convexQuery, convexForm, convexCommand } from "$lib/index.js"
	import { api } from "$convex/_generated/api"
	import { z } from "zod"

	const tasks = convexQuery(api.tasks.get, {})
	const createTask = convexForm(z.object({ text: z.string().min(1) }), api.tasks.create)
	const removeTask = convexCommand(api.tasks.remove)
	const toggleTask = convexCommand(api.tasks.toggleComplete)
</script>

<div class="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
	<strong>Client-side:</strong> Data fetched via WebSocket after component mounts.
	You'll see a brief loading state on navigation.
</div>

<form {...createTask} class="mb-6 flex gap-2">
	<input
		{...createTask.fields.text.as("text")}
		placeholder="Add a task..."
		class="flex-1 rounded border px-3 py-2"
	/>
	<button
		type="submit"
		disabled={!!createTask.pending}
		class="rounded bg-violet-600 px-4 py-2 text-white disabled:opacity-50"
	>
		{createTask.pending ? "Adding..." : "Add"}
	</button>
</form>

{#if tasks.isLoading}
	<div class="flex items-center justify-center py-12">
		<div class="h-6 w-6 animate-spin rounded-full border-2 border-violet-300 border-t-violet-600"></div>
		<span class="ml-3 text-sm text-neutral-500">Fetching from Convex...</span>
	</div>
{:else if tasks.error}
	<p class="text-red-600">Error: {tasks.error.message}</p>
{:else}
	<ul class="space-y-2">
		{#each tasks.data ?? [] as task (task._id)}
			<li class="flex items-center gap-3 rounded border px-3 py-2">
				<button onclick={() => toggleTask({ id: task._id })} class="text-lg" disabled={!!toggleTask.pending}>
					{task.isCompleted ? "☑" : "☐"}
				</button>
				<span class="flex-1" class:line-through={task.isCompleted}>{task.text}</span>
				<button
					onclick={() => removeTask({ id: task._id })}
					class="text-red-400 hover:text-red-600"
					disabled={!!removeTask.pending}
					aria-label="Delete task"
				>
					&times;
				</button>
			</li>
		{/each}
	</ul>
	{#if (tasks.data ?? []).length === 0}
		<p class="py-8 text-center text-neutral-400">No tasks yet. Add one above!</p>
	{/if}
{/if}

<div class="mt-8 rounded bg-neutral-50 p-3 text-xs font-mono text-neutral-500">
	mode: <span class="text-amber-600">client</span> | loading={tasks.isLoading} | items={tasks.data?.length ?? 0}
</div>
