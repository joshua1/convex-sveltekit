/**
 * Auth proxy — forwards /api/auth/* to the Convex site URL.
 * Cookies land on the SvelteKit domain so the server can read them for SSR.
 */
import { PUBLIC_CONVEX_SITE_URL } from "$env/static/public"
import type { RequestHandler } from "./$types"

const proxy: RequestHandler = async ({ request }) => {
  const url = new URL(request.url)
  const target = `${PUBLIC_CONVEX_SITE_URL}${url.pathname}${url.search}`

  const proxyRequest = new Request(target, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    // @ts-expect-error needed for streaming request bodies
    duplex: "half",
  })
  proxyRequest.headers.set("accept-encoding", "application/json")

  return fetch(proxyRequest, { redirect: "manual" })
}

export const GET = proxy
export const POST = proxy
