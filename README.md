# MASCOM

The Merchandising & Sponsorship Committee store for IIM Amritsar — a single
Next.js app covering both the student ordering flow and the committee console.

Mobile-first for students, desktop-first for the console, with an adaptive
light/dark liquid-glass interface throughout.

---

## Why the payment flow looks the way it does

MASCOM has **no merchant payment gateway**, so money moves person to person over
UPI. The whole product is built around making that trustworthy:

1. A student fills their bag and picks **which coordinator they are paying** at
   checkout. That single choice decides two things: whose QR they scan, and
   whose verification queue the order lands in.
2. They scan an **amount-locked QR** generated from that coordinator's UPI ID
   with the exact total already encoded — nothing to mistype. Their own saved QR
   stays one tap away as a fallback, and on a phone a `upi://` link hands off
   straight to GPay / PhonePe / Paytm.
3. They upload the payment screenshot (downscaled in the browser first) and,
   optionally, the UTR.
4. The order is created as **`Verification Pending`**. Nothing in the student
   path can mark a payment as received.
5. The coordinator opens their console queue, checks the screenshot against
   their own UPI history, and confirms. Only **the person the money was sent
   to** can do this; an admin can override, a moderator cannot. Confirming moves
   the order into production and counts the units sold; reversing it puts them
   back.

Prices, discounts and coupon maths are always recomputed on the server at order
creation — the client's numbers are never trusted. The coupon endpoint exists so
the QR shows the same total the server will later expect.

---

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill it in
npm run dev
```

Open http://localhost:3000.

### Environment

| Variable | What it does |
| --- | --- |
| `MONGODB_URI` | The database. Point it at the existing MASCOM cluster — this app reads and writes the same collections, so nothing has to be migrated. |
| `JWT_SECRET` | Signs session cookies. 32+ random chars (`openssl rand -base64 48`). |
| `SESSION_TTL_DAYS` | How long a session lasts. Defaults to 30. |
| `ALLOWED_EMAIL_DOMAINS` | Comma-separated domains allowed to register. Empty allows any. |
| `BOOTSTRAP_ADMIN_EMAILS` | Emails granted admin on first sign-up — use this to create the first admin. |
| `UPLOAD_DIR` | Where screenshots, product photos and QR images are written. Use a mounted persistent disk in production. |
| `UPLOAD_PUBLIC_PATH` | Public path those files are served from. |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL, used for metadata. |

### Scripts

| Command | |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run typecheck` | TypeScript, no emit |
| `npm run lint` | ESLint |
| `python3 scripts/gallery.py` | Regenerate `src/content/gallery.ts` after adding photos to `public/gallery/<Section>/` |

---

## How it is put together

```
src/
  app/
    page.tsx              Landing — hero, live drop, about, team, gallery
    (focus)/              Screens that deserve full attention: sign in, checkout
    (shop)/               Student shell: shop, bag, orders, account
    admin/                Console: overview, verify, orders, drops, collections,
                          runs & coupons, people
    api/                  Everything the client talks to
  components/
    ui/                   Glass kit: surfaces, buttons, fields, sheet, toast…
    shell/                Navigation, tab bar, footer, icons
    landing/ shop/ checkout/ orders/ admin/ account/
  lib/
    models/               Mongoose schemas mirroring the live collections
    auth.ts               Sessions (jose + bcrypt) and role helpers
    data.ts               Server-side reads for the shop
    orders.ts             Status derivation, order ids, risk flags
    storage.ts upi.ts validators.ts format.ts
  content/                Site copy and the generated gallery manifest
```

### Roles

| Role | Can |
| --- | --- |
| **Student** | Order, track, manage their own profile. |
| **Recipient** | Everything a student can, plus a console scoped to the payments sent to *them*, which only they can verify. |
| **Moderator** | The whole board: orders, drops, collections, runs, coupons, people. Cannot verify a payment they did not receive. |
| **Admin** | Everything, including overriding a verification and changing roles. |

Roles fold together, so one person can be both a recipient and an admin.

### The design system

`src/app/globals.css` holds the whole material. Surfaces are composed from a
tint, a specular rim, a lens flare and a cast shadow, over a slow ambient
gradient. Two accent tokens matter:

- `--accent` — the readable ink/mark colour on the page background.
- `--accent-solid` — the fill that sits *behind* `--accent-contrast` text.

In light mode they differ deliberately: a gold dark enough to read as text is
too dark to put dark text on top of.

There are real fallbacks, not just a dark-mode flip: `prefers-reduced-transparency`
swaps the glass for opaque surfaces, `prefers-reduced-motion` stops the ambient
drift, `prefers-contrast: more` thickens hairlines, and browsers without
`backdrop-filter` get a solid material.

---

## Data

The Mongoose models mirror the existing collections field for field — `users`,
`products`, `orders`, `paymentrecipients`, `batches`, `coupons` — so this app
can be pointed at the live database directly.

A few behaviours worth knowing:

- **Price bands.** Changing a product's price appends to `salesHistory` rather
  than overwriting it, so an order always keeps the price it was bought at.
- **Product snapshots.** Each order line freezes the product as it was, so
  editing the catalogue never rewrites someone's order history.
- **Production runs.** A run groups every order placed inside a date window
  under one batch number. Opening one adopts orders already sitting in the
  waiting pool; closing one returns them to it.
- **Nothing is hard-deleted** once it has history. A recipient with orders is
  deactivated, a product with orders is closed, a used coupon is paused.

## Uploads

Files are written to `UPLOAD_DIR` and served from `UPLOAD_PUBLIC_PATH`, the same
shape the previous Express server used — an existing mounted disk carries over.
On a platform with an ephemeral filesystem, point `UPLOAD_DIR` at a mounted
volume, or payment screenshots will not survive a redeploy.
