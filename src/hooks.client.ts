import { PUBLIC_CONVEX_URL } from "$env/static/public"
import { initConvex } from "$lib/index.js"

// Early init — before transport.decode / component hydration
initConvex(PUBLIC_CONVEX_URL)
