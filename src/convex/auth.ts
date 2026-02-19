import { createClient, type GenericCtx } from "@convex-dev/better-auth"
import { convex } from "@convex-dev/better-auth/plugins"
import { betterAuth } from "better-auth"
import type { BetterAuthOptions } from "better-auth"
import { components } from "./_generated/api"
import type { DataModel } from "./_generated/dataModel"
import { query } from "./_generated/server"
import authConfig from "./auth.config"

const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL as string

export const authComponent = createClient<DataModel>(components.betterAuth)

export const createAuthOptions = (ctx: GenericCtx<DataModel>) => {
  return {
    appName: "convex-sveltekit",
    baseURL: BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: [BETTER_AUTH_URL, "http://localhost:*"],
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [
      convex({
        authConfig,
        jwt: {
          definePayload: ({ user }) => ({
            name: user.name,
            email: user.email,
            image: user.image,
          }),
        },
      }),
    ],
  } satisfies BetterAuthOptions
}

export const createAuth = (ctx: GenericCtx<DataModel>) => betterAuth(createAuthOptions(ctx))

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const raw = await authComponent.safeGetAuthUser(ctx)
    if (!raw) return null
    return {
      id: raw._id,
      email: raw.email ?? "",
      name: raw.name ?? "",
      image: raw.image ?? null,
    }
  },
})
