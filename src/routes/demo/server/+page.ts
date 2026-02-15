import { convexLoad } from "$lib/index.js"
import { api } from "$convex/_generated/api"

export const load = async () => {
  return {
    tasks: await convexLoad(api.tasks.get, {}),
  }
}
