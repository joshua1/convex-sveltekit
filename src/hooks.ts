import {
  encodeConvexLoad,
  decodeConvexLoad,
  encodeConvexUser,
  decodeConvexUser,
} from "$lib/index.js"
import { api } from "$convex/_generated/api"

export const transport = {
  ConvexLoadResult: {
    encode: (value: unknown) => encodeConvexLoad(value),
    decode: (encoded: { refName: string; args: Record<string, unknown>; data: unknown }) =>
      decodeConvexLoad(encoded),
  },
  ConvexUserResult: {
    encode: (value: unknown) => encodeConvexUser(value),
    decode: (encoded: { data: Record<string, unknown> }) =>
      decodeConvexUser(encoded, api.auth.getCurrentUser, {}),
  },
}
