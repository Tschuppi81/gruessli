# Grüessli — TODO

## Go-live (gruessli.ch)

**Status (checked 2026-10-18):** `www.gruessli.ch` is **live and serving the app**
through the Cloudflare Tunnel (HTTP 200, `server: cloudflare`, real app HTML — so
traffic *is* routed edge → tunnel → `caddy:80`). This works without the full
(no-`skip_proxy`) deploy: Cloudflare terminates TLS at the edge and tunnels over
plain HTTP to Caddy, so no Let's Encrypt origin cert is needed for reachability.
Two gaps remain: the **apex has no DNS record** (bare `gruessli.ch` → browser
error), and the **live build is stale** (still shows the old `6 / 20 (examples)`
label removed in 9f8a55f).

- [ ] Set the gruessli.ch zone **SSL/TLS mode = Full** (match tastenfuchs; not
      Flexible — avoids a redirect loop since Caddy terminates TLS). *(Verify;
      edge→tunnel is HTTP so it may be moot, but set it to match tastenfuchs.)*
- [ ] **Fix the apex** `gruessli.ch` — currently no A/AAAA/CNAME record, so bare
      domain errors out. Resolve together with the www decision below:
- [ ] Decide **apex vs www**: either
      - serve the apex (add a `gruessli.ch` public hostname **and** add the domain
        to `apps/gruessli.yml` so Caddy answers for it), or
      - redirect `apex → www` (or `www → apex`) via a Cloudflare redirect rule.
- [ ] **Redeploy** — live build is stale. Full deploy to wire up Caddy +
      Let's Encrypt cert (and ship the latest build):
      `ansible-playbook -i inventory/hosts.yml playbooks/deploy-app.yml -e app_name=gruessli`
      (no `skip_proxy` this time).
- [ ] Visit the chosen canonical URL, create a postcard, confirm the counter
      ticks up — and confirm the stale `(examples)` label is gone.
- [x] Add **gruessli.ch** as a zone in Cloudflare (same account as tastenfuchs).
- [x] At **Infomaniak**, point gruessli.ch's **nameservers** to the two
      Cloudflare nameservers (NS now `houston`/`coco`.ns.cloudflare.com).
- [x] In Cloudflare **Zero Trust → Tunnels → Public Hostnames**, add a public
      hostname → HTTP → `caddy:80` (done for `www.gruessli.ch`, proxied CNAME to
      Cloudflare anycast IPs; app responds 200).

## homelab-infra
- [ ] Commit the `skip_proxy` flag added to `playbooks/deploy-app.yml`
      (uncommitted — lets you deploy an app before its DNS exists).

## Done
- [x] Favicon — inline SVG postcard-with-photo-grid icon in `index.html`
      (data-URI, no extra file).

## Nice-to-have
- [ ] Tooltips on the per-thumbnail controls — the ‹ (earlier), × (remove) and
      › (later) buttons under each photo have aria-labels but no hover `title`
      tooltip; add titles (localized) so the icons are self-explanatory.
- [ ] Background color picker — a nicer/more prominent picker than the current
      small native color input beside the swatches (e.g. a larger swatch grid or
      a hue/eyedropper control).
- [ ] Back up the `gruessli-data` volume (holds the postcard counter) — it is a
      named Docker volume, not Postgres, so it is outside the DB-backup flow.
- [ ] Consider abuse protection beyond rate limiting if the counter matters
      (the increment endpoint is intentionally public).
