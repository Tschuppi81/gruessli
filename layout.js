// Pure postcard layout math, shared by the page (index.html) and the tests.
//
// No DOM or canvas here — everything works on plain numbers: photo aspect
// ratios in, cell rectangles out. A "geo" describes the usable area of the
// card: { iw, ih, g (gap), x0, y0 } (plus s/m/cap, unused here).

// Justified layout: photos keep their order and their own shape. Each row is as
// wide as the card, cell widths follow the photos' aspect ratios, and row
// heights are scaled together to fill the card. The cost is the crop needed
// (|ln scale|). Returns up to `keep` cheapest arrangements.
export function solve(a, iw, ih, g, fixed, keep) {
  var n = a.length, P = [0], i
  for (i = 0; i < n; i++) P.push(P[i] + a[i])
  var maxRows = fixed ? Math.min(fixed, n) : Math.min(n, 7)
  var found = [], cuts = []
  function rec(start, used, sumH) {
    if (start === n) {
      if (fixed && used !== maxRows) return
      var avail = ih - g * (used - 1)
      if (avail <= 0) return
      var t = avail / sumH, cost = Math.abs(Math.log(t))
      if (found.length < keep || cost < found[found.length - 1].cost) {
        found.push({ cost: cost, t: t, cuts: cuts.slice() })
        found.sort(function (x, y) { return x.cost - y.cost })
        if (found.length > keep) found.pop()
      }
      return
    }
    if (used >= maxRows) return
    for (var end = start + 1; end <= n; end++) {
      var hn = (iw - g * (end - start - 1)) / (P[end] - P[start])
      if (hn <= 0) break
      cuts.push(end); rec(end, used + 1, sumH + hn); cuts.pop()
    }
  }
  rec(0, 0, 0)
  return found
}

export function buildRects(sol, a, iw, g, x0, y0) {
  var rects = new Array(a.length), start = 0, y = y0
  sol.cuts.forEach(function (end) {
    var sumA = 0, i
    for (i = start; i < end; i++) sumA += a[i]
    var hn = (iw - g * (end - start - 1)) / sumA, rh = hn * sol.t, x = x0
    for (i = start; i < end; i++) {
      var w = a[i] * hn
      rects[i] = { x: x, y: y, w: w, h: rh }
      x += w + g
    }
    y += rh + g; start = end
  })
  return rects
}

// Returns the best arrangement plus a few close alternatives (rows or columns)
// that the "Next arrangement" button cycles through.
export function arrange(a, geo, mode, count) {
  var cands = [], KEEP = 14
  if (mode !== "cols") {
    solve(a, geo.iw, geo.ih, geo.g, count, KEEP).forEach(function (s) {
      cands.push({ cost: s.cost, rects: buildRects(s, a, geo.iw, geo.g, geo.x0, geo.y0) })
    })
  }
  if (mode !== "rows") {
    var at = a.map(function (v) { return 1 / v })
    solve(at, geo.ih, geo.iw, geo.g, count, KEEP).forEach(function (s) {
      var rt = buildRects(s, at, geo.ih, geo.g, 0, 0)
      cands.push({
        cost: s.cost,
        rects: rt.map(function (r) { return { x: geo.x0 + r.y, y: geo.y0 + r.x, w: r.h, h: r.w } })
      })
    })
  }
  if (!cands.length) return null
  cands.sort(function (x, y) { return x.cost - y.cost })
  var limit = cands[0].cost + 0.25, seen = {}, out = []
  cands.forEach(function (c) {
    if (c.cost > limit || out.length >= 8) return
    var sig = c.rects.map(function (r) {
      return [r.x, r.y, r.w, r.h].map(Math.round).join(",")
    }).join(";")
    if (seen[sig]) return
    seen[sig] = 1; out.push(c)
  })
  return { cost: out[0].cost, variants: out }
}

// Simple grid used when the justified solver finds nothing (degenerate geo).
export function fallbackRects(n, geo) {
  var cols = Math.ceil(Math.sqrt(n)), rows = Math.ceil(n / cols), out = []
  var cw = (geo.iw - geo.g * (cols - 1)) / cols, rh = (geo.ih - geo.g * (rows - 1)) / rows
  for (var i = 0; i < n; i++) {
    out.push({ x: geo.x0 + (i % cols) * (cw + geo.g), y: geo.y0 + Math.floor(i / cols) * (rh + geo.g), w: cw, h: rh })
  }
  return out
}
