// Minimal zero-dependency server for Grüessli.
//
// Serves the static index.html and a tiny counter API that tracks how many
// postcards have been created (one increment per successful "Save as PNG").
// The count lives in a JSON file on a mounted volume so it survives restarts.

import { createServer } from 'node:http'
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT || 80)
const DATA_DIR = process.env.DATA_DIR || '/data'
const COUNT_FILE = join(DATA_DIR, 'count.json')

// Serve the single static page from memory — it never changes at runtime.
const INDEX_HTML = readFileSync(join(__dirname, 'index.html'))

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
      count += 1
      await persist()
      return sendJson(res, 200, { count })
    }
    res.writeHead(405, { allow: 'GET, POST' })
    return res.end()
  }

  if (url === '/healthz') {
    res.writeHead(200, { 'content-type': 'text/plain' })
    return res.end('ok')
  }

  // Everything else serves the app (single-page static site).
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
  res.end(INDEX_HTML)
})

await loadCount()
server.listen(PORT, () => console.log(`Grüessli listening on :${PORT}`))
