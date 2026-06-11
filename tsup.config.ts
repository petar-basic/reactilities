import { defineConfig } from 'tsup'
import { readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

// Build a flat entry map { hookName: 'src/<cat>/<hookName>/index.ts' } by scanning
// the category folders, so adding a hook auto-creates its subpath export. The
// barrel stays as `index`; types live under `types`.
const CATEGORIES = ['state', 'dom', 'utils', 'lifecycles', 'helpers']
const entry: Record<string, string> = {
  index: 'lib/main.ts',
  types: 'src/types/index.ts',
}
for (const cat of CATEGORIES) {
  const base = join('src', cat)
  for (const name of readdirSync(base)) {
    if (name === '__tests__') continue
    const indexPath = join(base, name, 'index.ts')
    if (existsSync(indexPath)) {
      if (entry[name]) {
        throw new Error(`Duplicate entry name "${name}" — subpath exports require unique hook names`)
      }
      entry[name] = indexPath
    }
  }
}

export default defineConfig({
  entry,
  format: ['esm', 'cjs'],
  experimentalDts: true,
  // No code splitting: each entry is self-contained so the "use client" banner
  // lands on the file the consumer actually imports (chunked re-export files
  // drop the directive). Shared helpers are tiny, so duplication is negligible.
  splitting: false,
  treeshake: true,
  clean: true,
  sourcemap: false,
  // React is a peer dep — never bundle it.
  external: ['react', 'react-dom', 'react/jsx-runtime'],
  // "use client" is added post-build (scripts/add-use-client.mjs) because
  // esbuild strips a `banner` directive. See that script for why.
  tsconfig: './tsconfig.lib.json',
  outExtension({ format }) {
    return { js: format === 'cjs' ? '.cjs' : '.js' }
  },
})
