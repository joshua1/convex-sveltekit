import { convexLoad } from "$lib/index.js"
import { api } from "$convex/_generated/api"

export const load = async () => ({
  tasks: await convexLoad(api.tasks.get, {}),
})
