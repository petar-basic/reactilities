// Prepend the "use client" directive to every emitted JS/CJS bundle.
//
// We can't use tsup's `banner` option: esbuild treats a leading "use client"
// string-statement as an unrecognized module directive and strips it (with a
// "Module level directives cause errors when bundled" warning). Every module in
// this hooks library is client-only, so we add the directive as a post-build
// step instead, which keeps Next.js App Router / RSC consumers from having to
// wrap their imports.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DIST = 'dist'
const DIRECTIVE = '"use client";\n'

let count = 0
for (const file of readdirSync(DIST)) {
  if (!/\.(js|cjs)$/.test(file)) continue
  const path = join(DIST, file)
  const src = readFileSync(path, 'utf8')
  if (/^['"]use client['"]/.test(src)) continue
  writeFileSync(path, DIRECTIVE + src)
  count += 1
}
console.log(`add-use-client: prepended directive to ${count} bundle(s)`)
