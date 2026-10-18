# Grüessli — TODO

## Go-live (gruessli.ch)
- [ ] Add **gruessli.ch** as a zone in Cloudflare (same account as tastenfuchs).
- [ ] At **Infomaniak**, point gruessli.ch's **nameservers** to the two
      Cloudflare nameservers (no A record / no www redirect at Infomaniak).
- [ ] In Cloudflare **Zero Trust → Tunnels → Public Hostnames**, add
      `gruessli.ch` → HTTP → `caddy:80` (auto-creates the proxied CNAME).
- [ ] Set the gruessli.ch zone **SSL/TLS mode = Full** (match tastenfuchs; not
      Flexible — avoids a redirect loop since Caddy terminates TLS).
- [ ] Decide **www.gruessli.ch**: either
      - serve it (add a `www.gruessli.ch` public hostname **and** add the domain
        to `apps/gruessli.yml` so Caddy answers for it), or
      - redirect `www → apex` via a Cloudflare redirect rule.
- [ ] Full deploy to wire up Caddy + Let's Encrypt cert:
      `ansible-playbook -i inventory/hosts.yml playbooks/deploy-app.yml -e app_name=gruessli`
      (no `skip_proxy` this time).
- [ ] Visit https://gruessli.ch, create a postcard, confirm the counter ticks up.

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
