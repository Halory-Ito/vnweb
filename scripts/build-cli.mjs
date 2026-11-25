import { build } from 'esbuild'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const defaultOutfile = path.join(repoRoot, 'dist', 'cli', 'vnweb-cli.mjs')

export async function buildCli(outfile = defaultOutfile) {
  const resolvedOut = path.resolve(outfile)
  await mkdir(path.dirname(resolvedOut), { recursive: true })

  await build({
    absWorkingDir: repoRoot,
    entryPoints: [path.join(repoRoot, 'cmd', 'tui.ts')],
    outfile: resolvedOut,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    tsconfig: path.join(repoRoot, 'tsconfig.json'),
    external: ['@libsql/client', 'libsql'],
    banner: {
      js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
    },
  })

  return resolvedOut
}

const isMainModule =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isMainModule) {
  const outArgIndex = process.argv.indexOf('--out')
  const outArg = outArgIndex !== -1 ? process.argv[outArgIndex + 1] : undefined
  buildCli(outArg)
    .then((output) => {
      console.log(`CLI built: ${output}`)
    })
    .catch((error) => {
      console.error('Build CLI failed:', error)
      process.exit(1)
    })
}
