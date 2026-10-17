# Grüessli

A client-side postcard creator. Drop 1 to 20 photos onto the page, arrange them
into an A6 grid, add a caption, and save the result as a print-ready PNG
(300 dpi at A6 size). Everything runs in the browser — no server, no upload,
no dependencies.

## Run locally

The page itself is a single static file — open `index.html` directly for a quick
look (the "postcards created" badge just stays hidden without the server).

To run the full app including the counter, use the bundled Node server (needs
Node 22+, no dependencies to install):

```sh
PORT=8080 DATA_DIR=./data node server.js   # then visit http://localhost:8080
```

## Features

- Upload 1–20 photos (file picker or drag & drop anywhere on the page)
- Justified auto-layout that follows each photo's aspect ratio, with rows/columns
  and a "Next arrangement" cycle through close alternatives
- Drag to reposition and scroll to zoom within each cell; drag a photo's corner
  handle onto another to swap them
- A6 landscape/portrait (or auto), adjustable gap, border, corner radius
- Background swatches + custom color, optional caption with three font styles
- Export to `postcard.png` at 1748 × 1240 px (A6, 300 dpi)
- Live "postcards created" counter, incremented on each save

## Counter

A tiny zero-dependency Node server (`server.js`) serves the page and a counter API:

- `GET /api/count` → `{ "count": N }` — read on page load to show the badge
- `POST /api/count` → increments and returns the new count — called after each
  successful "Save as PNG"

The count is stored in `count.json` under `DATA_DIR` (a Docker named volume in
production), written atomically so it survives restarts and redeploys.

## Deployment

Deployed from the [homelab-infra](https://github.com/Tschuppi81/homelab-infra)
repo via its `app` Ansible role (`apps/gruessli.yml`). The container runs the
Node server on port 80 with a `gruessli-data` volume mounted at `/data`, behind
the homelab reverse proxy on [gruessli.ch](https://gruessli.ch).
