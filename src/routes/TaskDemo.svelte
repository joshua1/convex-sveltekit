<script lang="ts">
  import { convexForm, convexCommand } from "$lib/index.js";
  import { api } from "$convex/_generated/api";
  import { z } from "zod";
  import type { ConvexQueryResult } from "$lib/index.js";

  let {
    tasks,
    mode,
  }: {
    tasks: ConvexQueryResult<typeof api.tasks.get>;
    mode: "client" | "server";
  } = $props();

  const createTask = convexForm(
    z.object({ text: z.string().min(1) }),
    api.tasks.create
  );
  const removeTask = convexCommand(api.tasks.remove);
  const toggleTask = convexCommand(api.tasks.toggleComplete);
</script>

<div class="demo">
  <nav>
    <a
      href="/#demo"
      aria-current={mode === "server" ? "page" : undefined}
      data-sveltekit-preload-data="hover"
    >
      Server-side
      <small>convexLoad()</small>
    </a>
    <a
      href="/client#demo"
      aria-current={mode === "client" ? "page" : undefined}
      data-sveltekit-preload-data="off"
    >
      Client-side
      <small>convexQuery()</small>
    </a>
  </nav>

  {#if mode === "client"}
    <aside data-variant="accent">
      <strong>Client-side:</strong> Data fetched via WebSocket after mount. Brief
      loading state on first load.
    </aside>
  {:else}
    <aside data-variant="success">
      <strong>Server-side:</strong> Data from load function. No spinner
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
    mode: <span class={mode === "client" ? "accent" : "success"}>{mode}</span> ·
    items: {tasks.data?.length ?? 0} · live via WebSocket
  </output>
</div>

<style>
  .demo {
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 1.5rem;
    background: var(--bg);
  }

  /* Tabs */
  .demo > nav {
    display: flex;
    gap: 2px;
    background: var(--bg-muted);
    padding: 3px;
    border-radius: 4px;
    margin-bottom: 1rem;
  }
  .demo > nav > a {
    flex: 1;
    text-align: center;
    padding: 0.4rem 0.75rem;
    border-radius: 3px;
    color: var(--text-soft);
    font-weight: 500;
    text-decoration: none;
  }
  .demo > nav > a:hover {
    color: var(--text);
    text-decoration: none;
  }
  .demo > nav > a[aria-current="page"] {
    background: var(--bg);
    color: var(--accent);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
  .demo > nav > a > small {
    display: block;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 0.75em;
    opacity: 0.7;
  }

  /* Notice */
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

  /* Form */
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
  .demo > form > button:hover {
    background: var(--accent-dim);
  }
  .demo > form > button:disabled {
    opacity: 0.5;
  }

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
    to {
      transform: rotate(360deg);
    }
  }
  .error {
    color: var(--danger);
  }
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

  /* Status */
  .demo > output {
    display: block;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border-soft);
    font-size: 0.875rem;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    color: var(--text-muted);
  }
  .accent {
    color: var(--accent);
  }
  .success {
    color: var(--success);
  }
</style>
