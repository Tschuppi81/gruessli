import test from 'node:test'
import assert from 'node:assert/strict'
import { arrange, fallbackRects } from '../layout.js'

// A6 landscape at 300 dpi with the app's default margin (3%) and gap (1.2%),
// no caption. Mirrors what geometry() in index.html builds at reference size.
const W = 1748, H = 1240, s = Math.min(W, H)
const m = 0.03 * s, g = 0.012 * s
const GEO = { s, m, g, cap: 0, x0: m, y0: m, iw: W - 2 * m, ih: H - 2 * m }
const EPS = 1 // rounding slack in device pixels

function assertWithinCard(rects) {
  for (const r of rects) {
    assert.ok(r.w > 0 && r.h > 0, 'cell has positive size')
    assert.ok(r.x >= GEO.x0 - EPS, 'cell left inside card')
    assert.ok(r.y >= GEO.y0 - EPS, 'cell top inside card')
    assert.ok(r.x + r.w <= GEO.x0 + GEO.iw + EPS, 'cell right inside card')
    assert.ok(r.y + r.h <= GEO.y0 + GEO.ih + EPS, 'cell bottom inside card')
  }
}

test('1 image: single cell filling the usable area', () => {
  const res = arrange([1.5], GEO, 'auto', 0)
  assert.ok(res, 'an arrangement is found')
  const rects = res.variants[0].rects
  assert.equal(rects.length, 1, 'exactly one cell for one photo')
  assertWithinCard(rects)
  // The lone cell should span essentially the whole usable width and height.
  assert.ok(rects[0].w >= GEO.iw - EPS, 'cell spans the full inner width')
  assert.ok(rects[0].h >= GEO.ih - EPS, 'cell spans the full inner height')
})

test('20 images: exactly 20 non-degenerate cells, all inside the card', () => {
  const aspects = Array.from({ length: 20 }, (_, i) => (i % 2 ? 0.75 : 1.5))
  const res = arrange(aspects, GEO, 'auto', 0)
  assert.ok(res, 'an arrangement is found')
  assert.ok(res.variants.length >= 1, 'at least one variant')
  for (const v of res.variants) {
    assert.equal(v.rects.length, 20, 'every variant places all 20 photos')
    assertWithinCard(v.rects)
  }
})

test('fallbackRects returns one cell per photo within the card', () => {
  for (const n of [1, 20]) {
    const rects = fallbackRects(n, GEO)
    assert.equal(rects.length, n)
    assertWithinCard(rects)
  }
})
