import { PUBLIC_CONVEX_URL } from "$env/static/public"
import { initConvex } from "$lib/index.js"

// Early init — before server-side load functions (convexLoad, serverQuery) run
initConvex(PUBLIC_CONVEX_URL)
