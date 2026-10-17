// Set a small, fast window before importing the server so the limiter is
// easy to exercise. node --test runs each test file in its own process, so
// these env vars don't leak into the other suites.
process.env.RATE_MAX = '3'
process.env.RATE_WINDOW_MS = '60000'

import test from 'node:test'
import assert from 'node:assert/strict'

const { rateLimited, hits, RATE_MAX, RATE_WINDOW_MS } = await import('../server.js')

test('allows up to RATE_MAX increments per window', () => {
  hits.clear()
  const now = 1_000
  for (let i = 0; i < RATE_MAX; i++) {
    assert.equal(rateLimited('1.2.3.4', now), null, `increment ${i + 1} should be allowed`)
  }
})

test('blocks the increment past the limit and reports a positive retry delay', () => {
  hits.clear()
  const now = 1_000
  for (let i = 0; i < RATE_MAX; i++) rateLimited('1.2.3.4', now)
  const retry = rateLimited('1.2.3.4', now)
  assert.equal(typeof retry, 'number')
  assert.ok(retry > 0 && retry <= RATE_WINDOW_MS / 1000, `retry ${retry}s within window`)
})

test('limits each IP independently', () => {
  hits.clear()
  const now = 1_000
  for (let i = 0; i < RATE_MAX; i++) rateLimited('1.1.1.1', now)
  assert.ok(rateLimited('1.1.1.1', now) > 0, 'first IP is blocked')
  assert.equal(rateLimited('2.2.2.2', now), null, 'a different IP is unaffected')
})

test('resets once the window has elapsed', () => {
  hits.clear()
  const now = 1_000
  for (let i = 0; i < RATE_MAX; i++) rateLimited('9.9.9.9', now)
  assert.ok(rateLimited('9.9.9.9', now) > 0, 'blocked within the window')
  const later = now + RATE_WINDOW_MS + 1
  assert.equal(rateLimited('9.9.9.9', later), null, 'allowed again in the next window')
})
