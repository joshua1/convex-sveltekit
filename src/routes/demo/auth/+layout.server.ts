import { convexUser } from "$lib/index.js"
import type { LayoutServerLoad } from "./$types"

export const load: LayoutServerLoad = async ({ locals }) => ({
  convexToken: locals.convexToken ?? null,
  user: convexUser(locals.user),
})
