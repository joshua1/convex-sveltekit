import { v } from "convex/values"
import { internalMutation, mutation, query } from "./_generated/server"

export const get = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query("tasks").order("desc").collect()
	},
})

export const create = mutation({
	args: { text: v.string() },
	handler: async (ctx, { text }) => {
		return await ctx.db.insert("tasks", { text, isCompleted: false })
	},
})

export const remove = mutation({
	args: { id: v.id("tasks") },
	handler: async (ctx, { id }) => {
		await ctx.db.delete(id)
	},
})

export const toggleComplete = mutation({
	args: { id: v.id("tasks") },
	handler: async (ctx, { id }) => {
		const task = await ctx.db.get(id)
		if (!task) throw new Error("Task not found")
		await ctx.db.patch(id, { isCompleted: !task.isCompleted })
	},
})

const defaultTasks = [
	{ text: "Install SvelteKit", isCompleted: true },
	{ text: "Go for a walk", isCompleted: true },
	{ text: "Sign up for Convex", isCompleted: false },
	{ text: "Star this repo", isCompleted: false },
]

export const cleanAndSeed = internalMutation({
	args: {},
	handler: async (ctx) => {
		const tasks = await ctx.db.query("tasks").collect()
		for (const task of tasks) {
			await ctx.db.delete(task._id)
		}
		for (const task of defaultTasks) {
			await ctx.db.insert("tasks", task)
		}
	},
})
