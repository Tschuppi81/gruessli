// Server-side of "saving a postcard": each successful save calls POST /api/count,
// which must increment the count AND persist it to disk so it survives a restart.
// (The actual PNG canvas export is a browser concern — see e2e/save.spec.js.)

import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const dataDir = mkdtempSync(join(tmpdir(), 'gruessli-'))
process.env.DATA_DIR = dataDir

import test from 'node:test'
import assert from 'node:assert/strict'

const { server, COUNT_FILE } = await import('../server.js')

const base = await new Promise((resolve) => {
  server.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${server.address().port}`))
})

test.after(() => {
  server.close()
  rmSync(dataDir, { recursive: true, force: true })
})

test('serves the Grüessli page', async () => {
  const res = await fetch(base + '/')
  assert.equal(res.status, 200)
  const html = await res.text()
  assert.match(html, /Gr(ü|&uuml;)essli/)
})

test('starts at zero', async () => {
  const res = await fetch(base + '/api/count')
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { count: 0 })
})

test('each save increments the count and persists it to disk', async () => {
  const first = await (await fetch(base + '/api/count', { method: 'POST' })).json()
  assert.equal(first.count, 1)
  const second = await (await fetch(base + '/api/count', { method: 'POST' })).json()
  assert.equal(second.count, 2)

  // The increment is written through before the response returns.
  const onDisk = JSON.parse(readFileSync(COUNT_FILE, 'utf8'))
  assert.deepEqual(onDisk, { count: 2 })

  // A fresh read reflects the saved total.
  const get = await (await fetch(base + '/api/count')).json()
  assert.equal(get.count, 2)
})
