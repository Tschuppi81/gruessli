// Minimal zero-dependency server for Grüessli.
//
// Serves the static index.html and a tiny counter API that tracks how many
// postcards have been created (one increment per successful "Save as PNG").
// The count lives in a JSON file on a mounted volume so it survives restarts.

import { createServer } from 'node:http'
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT || 80)
const DATA_DIR = process.env.DATA_DIR || '/data'
const COUNT_FILE = join(DATA_DIR, 'count.json')

// Per-IP rate limit for the increment endpoint: at most RATE_MAX increments
// per RATE_WINDOW_MS, using a fixed window. This caps how far any single
// client can distort the counter; it is not real authentication (the endpoint
// is public by design), just a brake on bots and runaway loops.
const RATE_MAX = Number(process.env.RATE_MAX || 10)
const RATE_WINDOW_MS = Number(process.env.RATE_WINDOW_MS || 60_000)
const hits = new Map() // ip -> { count, resetAt }

// Trust the proxy-supplied visitor IP (Caddy/cloudflared set Cf-Connecting-Ip;
// X-Forwarded-For is the fallback), then the raw socket for local runs.
function clientIp(req) {
  const cf = req.headers['cf-connecting-ip']
  if (cf) return String(cf)
  const xff = req.headers['x-forwarded-for']
  if (xff) return String(xff).split(',')[0].trim()
  return req.socket.remoteAddress || 'unknown'
}

// Returns null if allowed, or the seconds to wait if the limit is exceeded.
// `now` is injectable so the fixed-window behaviour can be tested deterministically.
function rateLimited(ip, now = Date.now()) {
  const e = hits.get(ip)
  if (!e || now >= e.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return null
  }
  if (e.count >= RATE_MAX) return Math.ceil((e.resetAt - now) / 1000)
  e.count += 1
  return null
}

// Drop expired entries periodically so the map can't grow without bound.
setInterval(() => {
  const now = Date.now()
  for (const [ip, e] of hits) if (now >= e.resetAt) hits.delete(ip)
}, RATE_WINDOW_MS).unref()

// Serve the static assets from memory — they never change at runtime.
const INDEX_HTML = readFileSync(join(__dirname, 'index.html'))
const LAYOUT_JS = readFileSync(join(__dirname, 'layout.js'))

// In-memory counter, loaded once at startup and persisted on every increment.
let count = 0
let writing = Promise.resolve() // serializes file writes

async function loadCount() {
  try {
    const raw = await readFile(COUNT_FILE, 'utf8')
    const n = JSON.parse(raw).count
    if (Number.isFinite(n) && n >= 0) count = Math.floor(n)
  } catch {
    // No file yet (first run) or unreadable — start from 0.
  }
}

// Atomic write: write a temp file then rename over the target, so a crash
// mid-write can never leave a truncated count.json behind.
function persist() {
  writing = writing.then(async () => {
    await mkdir(DATA_DIR, { recursive: true })
    const tmp = COUNT_FILE + '.tmp'
    await writeFile(tmp, JSON.stringify({ count }))
    await rename(tmp, COUNT_FILE)
  }).catch((err) => console.error('persist failed:', err))
  return writing
}

function sendJson(res, status, body) {
  const data = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(data)
}

const server = createServer(async (req, res) => {
  const url = (req.url || '/').split('?')[0]

  if (url === '/api/count') {
    if (req.method === 'GET') return sendJson(res, 200, { count })
    if (req.method === 'POST') {
      const retry = rateLimited(clientIp(req))
      if (retry !== null) {
        res.setHeader('retry-after', String(retry))
        return sendJson(res, 429, { error: 'rate_limited', count })
      }
      count += 1
      await persist()
      return sendJson(res, 200, { count })
    }
    res.writeHead(405, { allow: 'GET, POST' })
    return res.end()
  }

  if (url === '/layout.js') {
    res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' })
    return res.end(LAYOUT_JS)
  }

  if (url === '/healthz') {
    res.writeHead(200, { 'content-type': 'text/plain' })
    return res.end('ok')
  }

  // Everything else serves the app (single-page static site).
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
  res.end(INDEX_HTML)
})

// Only bind a port when run directly (`node server.js`); importing the module
// in tests just pulls in the helpers below without starting a listener.
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  await loadCount()
  server.listen(PORT, () => console.log(`Grüessli listening on :${PORT}`))
}

export { server, rateLimited, clientIp, hits, RATE_MAX, RATE_WINDOW_MS, COUNT_FILE }
