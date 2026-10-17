# Grüessli

A client-side postcard creator. Drop 1 to 20 photos onto the page, arrange them
into an A6 grid, add a caption, and save the result as a print-ready PNG
(300 dpi at A6 size). Everything runs in the browser — no server, no upload,
no dependencies.

## Run locally

It's a single static file. Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8080   # then visit http://localhost:8080
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

## Deployment

Deployed from the [homelab-infra](https://github.com/Tschuppi81/homelab-infra)
repo via its `app` Ansible role (`apps/gruessli.yml`). The container is a plain
nginx image serving the static file on port 80, behind the homelab reverse
proxy on [gruessli.ch](https://gruessli.ch).
