# BRENSTA — Deployment Guide

Target: a single Ubuntu 24.04 ARM VM (Oracle Cloud Always Free works well)
running the Next.js app, with Neon PostgreSQL as the managed database and
Caddy terminating HTTPS. Strict ₹0 hosting budget.

> **This document covers code and operations only.** It does NOT instruct
> you to sign up for anything or configure DNS — do those steps yourself
> with the vendor dashboards.

---

## 0. Pre-flight — things that must be true before you touch the VM

- Pending migrations resolved — `git status` shows no uncommitted
  `prisma/schema.prisma` drift that is not covered by a migration file in
  `prisma/migrations/`. Prisma refuses to deploy against a drifted schema.
- `pnpm launch:check` on your laptop reports **zero** `[PLACEHOLDER]`
  markers in `lib/policies.ts` and **zero** env errors (warnings in dev
  are fine).
- You have reviewed `HANDOVER.md` §9 (feature status) so you know which
  checkout and payment flows actually work. COD only today.

---

## 1. Required environment variables

The authoritative list is `.env.example`. The validator at
`lib/env.ts` enforces the subset below in production (`NODE_ENV=production`).

### Must be set (production hard-fails without these)

| Var | Example | Notes |
|---|---|---|
| `DATABASE_URL` | pooled Neon URL (`ep-<id>-pooler.ap-southeast-1.aws.neon.tech`) with `?sslmode=require&pgbouncer=true` | Runtime queries. PgBouncer transaction mode. See §3. |
| `DIRECT_URL` | direct Neon URL (same host **without** `-pooler`) with `?sslmode=require` | Used by `prisma migrate deploy` + shadow DB + `pg_dump`. No `pgbouncer=true`. See §3. |
| `AUTH_SECRET` | 32+ chars | Generate: `openssl rand -base64 32`. Rotate per environment. |
| `AUTH_URL` | `https://brensta.example` | HTTPS required unless localhost. |
| `NEXT_PUBLIC_SITE_URL` | `https://brensta.example` | Must not contain `localhost`. |

### Should be set before accepting real traffic (warnings)

| Var | Why |
|---|---|
| `RESEND_API_KEY` | Password-reset + order emails fall back to console provider when unset. |
| `EMAIL_FROM` | From-address for outbound mail. Must be on a verified Resend domain. |
| `AUTH_TRUST_HOST=true` | Only when running behind a reverse proxy that sets `X-Forwarded-*`. |

### Optional (features gated on these — leaving them empty is safe)

| Var | Feature |
|---|---|
| `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` | Google OAuth. **Both or neither.** |
| `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` + `RAZORPAY_WEBHOOK_SECRET` + `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Online payments. Not wired in code today; setting these does nothing until Milestone 6. |
| `SMS_DRIVER` + `MSG91_AUTH_KEY` + `MSG91_SENDER_ID` | SMS OTP. `msg91` driver is a stub until Phase GC-E. |
| `UPLOAD_DRIVER` | `local` (default) stores on disk. `s3` is reserved — not implemented. |
| `SHIPPING_PROVIDER` | Currently only `stub` is honored. |

### Server-only operator vars (never ship to a client)

| Var | Purpose |
|---|---|
| `BOOTSTRAP_ADMIN_EMAIL` / `_PASSWORD` / `_NAME` | Consumed once by `pnpm create:admin`. **Unset after first admin.** |

### Variables Prisma reads

Prisma CLI reads **`.env`** (not `.env.local`). Keep `DATABASE_URL` **and
`DIRECT_URL`** in both files, with the same values, during local dev. On
the VM you can set both via systemd `EnvironmentFile=` and skip `.env`
entirely.

---

## 2. VM provisioning (summary; do this in your cloud dashboard)

- Image: Ubuntu 24.04 LTS, ARM (aarch64) if you want Oracle Always Free.
- Shape: at least 2 OCPU / 12 GB RAM — `pnpm build` wants ~2 GB headroom.
- Open inbound: 22 (SSH), 80 and 443 (Caddy ACME + HTTPS).
- Attach a persistent block volume if the shape's root disk is ephemeral
  — mount it at `/srv/brensta` so uploads and backups survive reboots.

Then on the VM:

```bash
# System packages
sudo apt update
sudo apt install -y curl ca-certificates gnupg lsb-release \
  caddy postgresql-client-16 git

# Node 20 via nodesource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# pnpm (match the version pinned in package.json)
sudo npm install -g pnpm@12
```

---

## 3. Database — Neon PostgreSQL

Neon exposes the SAME database at TWO endpoints and this project needs both.

- **Pooled** (hostname contains `-pooler`) — PgBouncer transaction mode.
  Fast cold start, short-lived connections. Used by the running Next.js
  app. Set `DATABASE_URL` to this. Must include `?pgbouncer=true&sslmode=require`
  so Prisma skips prepared statements and TLS is enforced.
- **Direct** (same hostname **without** `-pooler`) — session mode.
  Required by `prisma migrate deploy`, `prisma db pull`, and `pg_dump`
  (transaction mode would break large exports and schema migrations).
  Set `DIRECT_URL` to this. Must include `?sslmode=require`. No pgbouncer flag.

Project region for launch-v1: **ap-southeast-1 (Singapore)**. Hostnames
look like `ep-<id>.ap-southeast-1.aws.neon.tech`.

Operational notes:

- The free compute **auto-suspends after ~5 min idle**. First request after
  suspend has a ~1–3 s cold start.
- The health probe at `/api/health` is intentionally DB-free, so an uptime
  monitor pinging it will NOT keep the Neon compute awake. That is
  deliberate: DB wakeups should happen only when real traffic needs them.
- `scripts/backup-db.sh` should run against **`DIRECT_URL`**, not the
  pooled URL. Export the direct value in that cron entry's environment.

Apply schema to the Neon database **from the VM** after `pnpm install`:

```bash
pnpm prisma generate
pnpm db:deploy                    # alias for `prisma migrate deploy`
pnpm db:seed                      # idempotent base data
pnpm create:admin                 # one-time, reads BOOTSTRAP_ADMIN_* envs
# Unset BOOTSTRAP_ADMIN_* in the systemd env file and reload.
```

Prisma `migrate deploy` is non-interactive and will refuse to proceed if
there is a drifted migration folder — fix locally first. For launch-v1
the schema file matches the two existing migrations exactly, so a deploy
against an empty Neon database produces a clean, auditable history.

---

## 4. Project checkout + build

```bash
sudo mkdir -p /srv/brensta
sudo chown "$USER":"$USER" /srv/brensta
cd /srv/brensta

# Option A — ship the handover zip
unzip ~/brensta-handover-20261025.zip

# Option B — git clone (if you have a remote)
# git clone <your-url> brensta && cd brensta

cd brensta
cp .env.example .env.local         # fill real values; see §1
cp .env.example .env               # Prisma CLI reads .env; keep DATABASE_URL in sync

pnpm install --frozen-lockfile
pnpm prisma generate
pnpm prisma migrate deploy
pnpm db:seed
pnpm create:admin
pnpm build
```

---

## 5. systemd service

Create `/etc/systemd/system/brensta.service`:

```ini
[Unit]
Description=BRENSTA Next.js app
After=network.target

[Service]
Type=simple
WorkingDirectory=/srv/brensta/brensta
EnvironmentFile=/srv/brensta/brensta/.env.local
ExecStart=/usr/bin/pnpm start
Restart=on-failure
RestartSec=5
User=brensta
Group=brensta
# Hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/srv/brensta/brensta/public/uploads /srv/brensta/brensta/backups
# Logs
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Permissions must match the user named in `User=` — `chown -R brensta:brensta /srv/brensta/brensta/public/uploads /srv/brensta/brensta/backups`.

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now brensta
sudo systemctl status brensta
sudo journalctl -fu brensta
```

The app listens on `127.0.0.1:3000`. Caddy proxies 443 → 3000.

---

## 6. Caddy HTTPS

Install Caddy (step 2 already did). Replace `/etc/caddy/Caddyfile` with:

```caddy
brensta.example {
    encode zstd gzip
    reverse_proxy 127.0.0.1:3000

    # The app sets security headers; Caddy adds the stuff only a proxy knows.
    header Strict-Transport-Security "max-age=31536000; includeSubDomains"

    # Health probe doesn't need to be rate-limited aggressively.
    @health path /api/health
    handle @health {
        reverse_proxy 127.0.0.1:3000
    }

    log {
        output file /var/log/caddy/brensta.log
        format json
    }
}
```

Then:

```bash
sudo systemctl reload caddy
curl -I https://brensta.example/api/health   # expect 200 and the security headers
```

Caddy auto-provisions a Let's Encrypt cert on first HTTPS request.

**Cloudflare** in front of Caddy (free): set SSL mode to **Full (strict)**.
Do NOT set the cloud to Flexible — it would strip HTTPS between CF and the
origin and NextAuth would reject session cookies.

---

## 7. Backups

Shell scripts live at `scripts/backup-db.sh` and `scripts/backup-uploads.sh`
and are **not executed by this guide**. They are safe to invoke manually
first to confirm shape, then wired into cron.

### Manual smoke-test (run interactively once)

```bash
# From the project root, with DATABASE_URL already in your environment:
bash scripts/backup-db.sh
bash scripts/backup-uploads.sh
ls -lh backups/
```

### Cron (daily)

```crontab
17 2 * * * cd /srv/brensta/brensta && . .env.local && bash scripts/backup-db.sh      >>/var/log/brensta-backup.log 2>&1
37 2 * * * cd /srv/brensta/brensta &&                   bash scripts/backup-uploads.sh >>/var/log/brensta-backup.log 2>&1
```

### Off-host sync

The scripts leave files in `./backups/`. The ₹0 way to get them off-host:

- Install `rclone`.
- Create a free Backblaze B2 bucket (10 GB free) or Cloudflare R2 (10 GB free).
- Append to cron:

  ```crontab
  47 2 * * * rclone copy /srv/brensta/brensta/backups b2:brensta-backups --min-age 10m
  ```

- Verify the first push succeeds before deleting the local files.

### Retention

Both scripts self-prune — DB keeps 30 most recent dumps, uploads keep 14.
Adjust the `tail -n +N` values at the bottom of each script if you need
longer windows.

---

## 8. Verification checklist (post-deploy)

Run through this before you point real traffic at the host:

- [ ] `curl -I https://your-domain/api/health` returns `200` and all security headers.
- [ ] HSTS header is present on prod (`Strict-Transport-Security: max-age=31536000; ...`).
- [ ] `curl -I https://your-domain/admin` returns `200` with `X-Frame-Options: DENY` + `X-Robots-Tag`-style noindex via the admin layout metadata, and the sign-in page loads.
- [ ] Login as admin, verify the dashboard renders.
- [ ] Place a COD test order end-to-end as a logged-in user. Confirm the order appears in admin and in order history.
- [ ] Run `pnpm launch:check` on the VM — zero errors, acceptable warnings only.
- [ ] `pg_dump` + uploads smoke test succeed (previous section).
- [ ] First cron run has completed and files are visible both on disk and in the off-host bucket.
- [ ] `BOOTSTRAP_ADMIN_*` env vars have been removed from the systemd environment file and the admin password has been rotated via the UI.
- [ ] You know how to restore from the latest backup — run a dry-run restore into a scratch Neon branch at least once before launch.

---

## 9. Known deferred items (do NOT claim these are done)

- Online payments (Razorpay) — refused in code at `lib/orders.ts:81-82`. COD only.
- Guest checkout — still gated by `middleware.ts`; GC-A primitives exist, GC-B UI not shipped.
- SMS driver — `lib/sms/msg91.ts` is a stub. Do not set `SMS_DRIVER=msg91` in production.
- Reviews work is paused with uncommitted code floating; the known failing test documents this.
- Content Security Policy — intentionally not configured yet. Add in report-only mode first; enforce only after live QA.
- Rate limiter is in-memory. Single-instance only. Swap to Upstash Redis before adding a second host.
