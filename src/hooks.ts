import { encodeConvexLoad, decodeConvexLoad } from "$lib/index.js"

export const transport = {
	ConvexLoadResult: {
		encode: (value: unknown) => encodeConvexLoad(value),
		decode: (encoded: { refName: string; args: Record<string, unknown>; data: unknown }) =>
			decodeConvexLoad(encoded),
	},
}
