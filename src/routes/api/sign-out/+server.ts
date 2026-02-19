import { json } from "@sveltejs/kit"
import type { RequestHandler } from "./$types"

const COOKIES = [
  "better-auth.session_token",
  "better-auth.convex_jwt",
  "__Secure-better-auth.session_token",
  "__Secure-better-auth.convex_jwt",
]

export const POST: RequestHandler = async ({ cookies }) => {
  for (const name of COOKIES) {
    cookies.delete(name, { path: "/" })
  }
  return json({ ok: true })
}
