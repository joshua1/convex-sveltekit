/**
 * Validates that dist/ only contains modules re-exported from src/lib/index.ts.
 * Catches demo or app-specific files that accidentally leak into the package.
 *
 * Usage: node scripts/check-dist.js
 */
import { readFileSync, readdirSync } from "node:fs"

const indexSrc = readFileSync("src/lib/index.ts", "utf-8")

const importRe = /from\s+["']\.\/(.+?)["']/g
const allowedBases = new Set(["index", "README"])
for (const [, mod] of indexSrc.matchAll(importRe)) {
  allowedBases.add(mod.replace(/\.js$/, ""))
}

const distFiles = readdirSync("dist")
const unexpected = distFiles.filter((f) => {
  const base = f.replace(/\.(js|d\.ts|ts|md)$/, "")
  return !allowedBases.has(base)
})

if (unexpected.length) {
  console.error("Unexpected files in dist/ (not re-exported from index.ts):")
  unexpected.forEach((f) => console.error(`  - ${f}`))
  process.exit(1)
}

console.log(`dist/ OK — ${distFiles.length} files, all accounted for.`)
