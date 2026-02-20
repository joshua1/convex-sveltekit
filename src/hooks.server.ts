import { sequence } from "@sveltejs/kit/hooks"
import { PUBLIC_CONVEX_URL } from "$env/static/public"
import { initConvex } from "$lib/index.js"
import { handleAuth } from "$demo/auth.server.js"

initConvex(PUBLIC_CONVEX_URL)

export const handle = sequence(handleAuth)
