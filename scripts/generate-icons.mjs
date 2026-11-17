import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

// Small deterministic PNG rasterizer; no image service or native dependency.
const output = fileURLToPath(new URL('../public/icons/', import.meta.url))
mkdirSync(output, { recursive: true })
const palette = {
  green: [22, 61, 48],
  lime: [216, 239, 145],
  cream: [255, 248, 232],
  wood: [223, 185, 134],
}

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const name = Buffer.from(type)
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const checksum = Buffer.alloc(4)
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])))
  return Buffer.concat([length, name, data, checksum])
}

function pixel(x, y) {
  const dx = x - 31
  const dy = y - 35
  const along = (dx + dy) / Math.SQRT2
  const across = (dx - dy) / Math.SQRT2
  let color = palette.green
  if (along >= 0 && along < 26 && Math.abs(across) < 4.6) color = palette.wood
  const px = x - 27
  const py = y - 25
  const rx = px * 0.766 - py * 0.643
  const ry = px * 0.643 + py * 0.766
  if ((rx / 16) ** 2 + (ry / 18) ** 2 < 1) color = Math.abs(rx) < 0.7 ? palette.green : palette.lime
  if ((x - 48) ** 2 + (y - 15) ** 2 < 6.4 ** 2) color = palette.cream
  return color
}

for (const [name, size] of [
  ['icon-192', 192],
  ['icon-512', 512],
  ['icon-maskable', 512],
  ['apple-touch-icon', 180],
]) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const color = [0, 0, 0]
      for (let sy = 0; sy < 2; sy++)
        for (let sx = 0; sx < 2; sx++) {
          const sample = pixel(
            ((x + (sx + 0.5) / 2) / size) * 64,
            ((y + (sy + 0.5) / 2) / size) * 64,
          )
          for (let channel = 0; channel < 3; channel++) color[channel] += sample[channel] / 4
        }
      const index = y * (size * 4 + 1) + 1 + x * 4
      for (let channel = 0; channel < 3; channel++)
        raw[index + channel] = Math.round(color[channel])
      raw[index + 3] = 255
    }
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header[8] = 8
  header[9] = 6
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
  writeFileSync(`${output}/${name}.png`, png)
  console.log(`${name}.png · ${size}×${size}`)
}
