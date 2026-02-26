import { command, getRequestEvent } from "$app/server"

const AUTH_COOKIES = [
      "better-auth.session_token",
      "better-auth.convex_jwt",
      "__Secure-better-auth.session_token",
      "__Secure-better-auth.convex_jwt",
] as const

export const clearAuthCookies = command(async () => {
      const { cookies } = getRequestEvent()

      for (const name of AUTH_COOKIES) {
            cookies.delete(name, { path: "/" })
      }
})
