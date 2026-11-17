import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Read-only smoke check against the production preview, not a browser/offline test.
const base = new URL(process.argv[2] ?? 'http://127.0.0.1:5188/')
assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(base.hostname), 'Use a local preview URL')
assert.ok(['http:', 'https:'].includes(base.protocol), 'Use HTTP or HTTPS')
assert.ok(!base.username && !base.password && !base.search && !base.hash, 'Use a plain preview URL')
assert.equal(base.pathname, '/', 'Serve the demo at the domain root')

const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const types = {
  html: /text\/html/i,
  js: /(?:javascript|ecmascript)/i,
  css: /text\/css/i,
  png: /image\/png/i,
  svg: /image\/svg\+xml/i,
  woff2: /(?:font\/woff2|application\/(?:font-woff|octet-stream))/i,
  webmanifest: /(?:manifest\+json|application\/json)/i,
}
const assets = readdirSync(dist, { recursive: true }).filter(
  (file) => typeof file === 'string' && /\.(html|js|css|png|svg|woff2|webmanifest)$/.test(file),
)
assert.ok(assets.includes('index.html') && assets.includes('sw.js'), 'Build the PWA first')

await Promise.all(
  ['/', ...assets].map(async (file) => {
    const response = await fetch(new URL(file.replaceAll('\\', '/'), base), {
      credentials: 'omit',
      redirect: 'error',
      signal: AbortSignal.timeout(10000),
    })
    assert.equal(response.status, 200, `HTTP error: ${file}`)
    const builtFile = file === '/' ? 'index.html' : file
    const extension = builtFile.split('.').at(-1)
    assert.match(
      response.headers.get('content-type') ?? '',
      types[extension],
      `Wrong content type: ${file}`,
    )
    const served = Buffer.from(await response.arrayBuffer())
    assert.ok(
      served.equals(
        readFileSync(
          new URL(builtFile.replaceAll('\\', '/'), new URL('../dist/', import.meta.url)),
        ),
      ),
      `Stale or wrong asset: ${file}`,
    )
  }),
)
console.log(
  `Preview HTTP OK: root and ${assets.length} production files match the build and have valid content types.`,
)
