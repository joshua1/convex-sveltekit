/**
 * Server-side auth handle — reads the Better Auth JWT cookie and populates
 * event.locals.convexToken + event.locals.user for SSR.
 *
 * Zero network calls — just reads the cookie the browser already sends.
 */
import type { Handle } from "@sveltejs/kit"

const JWT_COOKIE = "better-auth.convex_jwt"
const SESSION_COOKIE = "better-auth.session_token"

export const handleAuth: Handle = async ({ event, resolve }) => {
  const { pathname } = event.url
  if (!pathname.startsWith("/demo/auth") && !pathname.startsWith("/api/auth")) {
    return resolve(event)
  }

  const token = event.cookies.get(JWT_COOKIE) ?? event.cookies.get(`__Secure-${JWT_COOKIE}`)
  const session = event.cookies.get(SESSION_COOKIE) ?? event.cookies.get(`__Secure-${SESSION_COOKIE}`)

  if (token && !session) {
    event.cookies.delete(JWT_COOKIE, { path: "/" })
    event.cookies.delete(`__Secure-${JWT_COOKIE}`, { path: "/", secure: true })
    return resolve(event)
  }

  if (token) {
    event.locals.convexToken = token

    try {
      const payload = JSON.parse(atob(token.split(".")[1]!))
      event.locals.user = {
        id: payload.sub,
        email: payload.email ?? "",
        name: payload.name ?? "",
        image: payload.image ?? null,
      }
    } catch {
      // Malformed JWT — token still set for Convex to validate
    }
  }

  return resolve(event)
}
