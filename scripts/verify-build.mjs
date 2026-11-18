import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Checks the generated artifacts, not service worker behaviour on a real device.
const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const read = (name) => readFileSync(`${dist}/${name}`, 'utf8')
const manifest = JSON.parse(read('manifest.webmanifest'))
assert.equal(manifest.name, 'Perception · Reservas de ping-pong')
assert.equal(manifest.short_name, 'Perception')
assert.equal(manifest.display, 'standalone')
assert.equal(manifest.start_url, '/')
assert.equal(manifest.scope, '/')
assert.ok(manifest.icons.some((icon) => icon.sizes === '192x192'))
assert.ok(manifest.icons.some((icon) => icon.sizes === '512x512' && icon.purpose === 'maskable'))
for (const icon of manifest.icons) {
  assert.ok(existsSync(`${dist}${icon.src}`), icon.src)
  const image = readFileSync(`${dist}${icon.src}`)
  assert.equal(image.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `Not a PNG: ${icon.src}`)
  assert.equal(
    `${image.readUInt32BE(16)}x${image.readUInt32BE(20)}`,
    icon.sizes,
    `Wrong icon size: ${icon.src}`,
  )
}
assert.ok(existsSync(`${dist}/icons/apple-touch-icon.png`))
assert.match(read('index.html'), /manifest\.webmanifest/)
assert.match(read('index.html'), /<title>Perception · Reservas<\/title>/)
assert.match(read('index.html'), /gestión de socios de Perception\./)
for (const name of ['index.html', 'manifest.webmanifest']) {
  assert.doesNotMatch(read(name), /(?:spin\s+club|doscientos)/i, `Outdated branding: ${name}`)
}

const worker = read('sw.js')
const assets = readdirSync(`${dist}/assets`)
const offlineAssets = [
  'index.html',
  ...assets.filter((name) => /\.(js|css|woff2)$/.test(name)).map((name) => `assets/${name}`),
]
for (const asset of offlineAssets) assert.ok(worker.includes(asset), `Not precached: ${asset}`)
assert.ok(
  assets.some((name) => name.endsWith('.woff2')),
  'Fonts must be bundled locally',
)
for (const name of [
  'index.html',
  ...assets.filter((asset) => asset.endsWith('.css')).map((asset) => `assets/${asset}`),
]) {
  assert.doesNotMatch(read(name), /(?:src\s*=\s*["']|url\s*\(\s*["']?)https?:\/\//i)
}
console.log(
  `PWA artifacts OK: manifest, icons and ${offlineAssets.length} precached application assets.`,
)
