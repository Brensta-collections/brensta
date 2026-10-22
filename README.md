# BRENSTA

Premium women's fashion & lifestyle ecommerce — jewellery, clothing, bags, accessories, footwear.

- **Framework:** Next.js 16 (App Router) + TypeScript + React 19
- **Styling:** Tailwind CSS v4
- **Database:** PostgreSQL 16 + Prisma ORM 6
- **Auth:** NextAuth v5 (coming M4)
- **Payments:** Razorpay (sandbox, wired in M6)
- **Package manager:** pnpm

---

## Prerequisites (Ubuntu/Debian)

```bash
# Node 20+ (via nvm) and pnpm
node --version   # expect v20+
pnpm --version   # expect v9+ (we're on v12)

# PostgreSQL 16
sudo apt install -y postgresql-16
sudo systemctl enable --now postgresql
```

---

## First-time setup

```bash
# 1. Create DB user + database (one-time; the password is already set in .env)
sudo -u postgres psql -c "CREATE ROLE brensta WITH LOGIN PASSWORD '<pick-a-password>';"
sudo -u postgres psql -c "ALTER ROLE brensta CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE brensta_dev OWNER brensta;"

# 2. Install deps
pnpm install

# 3. Configure env
cp .env.example .env.local
# Edit .env.local: put the real DATABASE_URL and AUTH_SECRET.
# Also create a .env file with just the DATABASE_URL (Prisma CLI reads .env).

# 4. Run migrations
pnpm db:migrate

# 5. Seed demo categories + attributes + settings + policy drafts
pnpm db:seed

# 6. Create the first admin user (reads BOOTSTRAP_ADMIN_* from .env.local)
pnpm create:admin
```

---

## Daily commands

```bash
pnpm dev           # http://localhost:3000
pnpm db:studio     # Prisma Studio UI for DB
pnpm db:migrate    # apply new schema changes
pnpm db:seed       # re-run seed (idempotent)
pnpm test          # Vitest unit tests
pnpm test:e2e      # Playwright end-to-end
pnpm lint
pnpm build         # production build
```

---

## Project layout

```
brensta/
├─ app/                    # Next.js App Router pages
│  ├─ layout.tsx           # root layout + fonts (Inter + Playfair Display)
│  ├─ page.tsx             # homepage (DB-driven categories)
│  └─ globals.css          # Tailwind + brand tokens
├─ lib/
│  ├─ db.ts                # Prisma client singleton
│  └─ utils.ts             # cn(), formatINR(), slugify()
├─ prisma/
│  ├─ schema.prisma        # all 29 tables
│  ├─ migrations/
│  └─ seed.ts              # categories, attributes, settings, policies
├─ scripts/
│  └─ create-admin.ts      # bootstrap first admin user
├─ public/
├─ .env.example            # placeholders (committed)
├─ .env.local              # real secrets (gitignored)
└─ .env                    # Prisma CLI reads this (gitignored)
```

---

## What's live right now (end of Milestone 2)

- Homepage renders all 5 main categories and 42 subcategories from the database.
- Category tree is hierarchical (adjacency + materialized path).
- Per-category attribute system seeded (clothing sizes, jewellery material, bag type, footwear sizes…).
- Database-backed settings, policies, admin audit log, orders/payments schemas ready.

**Not yet live:** auth UI, product CRUD UI, cart UI, checkout, admin dashboard, payments, emails. Each comes in the matching milestone.

---

## Milestones

1. ✅ Inspect environment + finalise architecture
2. ✅ Project + database setup, migrations, seed
3. ⏳ Design system, storefront shell, product browse/cart/wishlist
4. ⏳ Auth + accounts + checkout
5. ⏳ Admin dashboard (categories, products, orders, customers, reviews, coupons)
6. ⏳ Razorpay sandbox + shipping adapter
7. ⏳ Policies, reviews, feedback, emails, SEO
8. ⏳ Tests, hardening, launch checklist

---

## Resuming a session

If the Claude session drops, context lives in `~/.claude/projects/-home-sharad-bade-firstcry-io-Desktop-Website/memory/MEMORY.md`.
A fresh session reads it first and continues from the current milestone.

---

## Security notes

- `.env*` is gitignored except `.env.example`.
- Passwords are hashed with bcryptjs (cost 12).
- Never commit real Razorpay/Resend/Google credentials.
- Admin dashboard is RBAC-gated (coming M5).
- Payment webhook signatures must be verified server-side (coming M6).
