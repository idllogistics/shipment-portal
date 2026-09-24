# ShipTrack — Live Shipment Tracking Portal

A shipment tracking website with a staff admin panel and a public customer
tracking page, built for **harmonydwc.ae**. Staff upload photos and update
status for a shipment; the customer's tracking page polls automatically and
shows new photos live, no customer account required. Drivers can also share
their live GPS location from their phone's browser — no app install — which
customers see as a live map while their shipment is in transit.

Status now advances **automatically**: the driver records pickup and
delivery (photo + item condition + the sender's/receiver's signature) from
their phone link, and that alone moves the shipment through its stages — no
admin login needed for the normal happy path. Admin login is only for
creating shipments, assigning drivers, and overriding/exceptions. Staff can
also upload an invoice/packing list per shipment, which Claude reads to
auto-fill the item description, quantity, and declared value.

## Stack

- Next.js (App Router, TypeScript)
- Tailwind CSS
- Prisma + Postgres (works with Neon, Vercel Postgres, Supabase, etc.)
- Vercel Blob for photo/signature/document storage
- Leaflet + OpenStreetMap for the live map (no API key needed)
- Cookie-based admin session (single shared admin password)
- Driver location sharing via the browser Geolocation API (no app install)
- Claude (Anthropic API) for reading uploaded invoices/packing lists

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Get a free Postgres database from [neon.com](https://neon.com) (or any
   Postgres host) and copy its connection string into `.env` as
   `DATABASE_URL`.

3. Create a Vercel Blob store (see **Deploying** below) and put its token
   into `.env` as `BLOB_READ_WRITE_TOKEN`.

4. Set your own `ADMIN_PASSWORD` and `SESSION_SECRET` in `.env`.

5. (Optional) Get an API key from [console.anthropic.com](https://console.anthropic.com)
   and put it in `.env` as `ANTHROPIC_API_KEY` — this powers the
   invoice/packing-list auto-fill. Without it, document upload still works,
   it just skips reading the document (fields stay blank until typed in
   manually).

6. Create the database tables:

   ```bash
   npx prisma migrate dev --name init
   ```

7. Run the dev server:

   ```bash
   npm run dev
   ```

8. Open [http://localhost:3000](http://localhost:3000).

## How it works

- **Customers**: go to the home page, enter their tracking number, and land
  on `/track/[trackingNumber]` — a live-updating page (polls every 6s) that
  shows shipment status, a status timeline, a photo gallery, and pickup/
  delivery proof (condition, signature, photos) once the driver records them.
- **Staff**: go to `/admin`, log in with `ADMIN_PASSWORD`, create a shipment
  (this generates a tracking number to give the customer). Assign a driver,
  optionally upload an invoice/packing list to auto-fill item details, and
  the shipment's status now takes care of itself as the driver works through
  it — the manual status dropdown is still there for overrides.
- **Drivers**: go to `/admin/drivers` to add a driver — this generates a
  private link (`/driver/[accessCode]`). Send that link to the driver (e.g.
  via WhatsApp); they open it on their phone and tap **Start sharing
  location** while on a delivery run. No account needed — it uses their
  phone browser's GPS. This web version only tracks while the browser tab
  stays open and the phone isn't locked; for tracking that survives a locked
  screen or a backgrounded app, drivers should instead install the
  [driver-app](../driver-app) native app, which uses the same access
  code/link and the same backend routes. Assign a driver to a shipment from
  the shipment's page; while the shipment is Picked Up, In Transit, or Out
  for Delivery, the customer's tracking page shows the driver's live
  position on a map (their name/phone are never exposed to the customer —
  only the location dot). A location ping older than 30 minutes is treated
  as stale and hidden, so a driver who goes off duty doesn't leave a frozen
  pin. On the same page, their assigned shipments list a **Record pickup**
  or **Record delivery** button (whichever applies) — tapping it opens a
  form for item condition, a photo, and a signature from whoever's handing
  off or receiving the shipment. Submitting it is what advances the status.

- **Driver login** (`/driver`): drivers enter their driver code (or paste
  their link) and stay signed in on that phone until they log out. Each
  assigned shipment shows its **Pickup** and **Drop-off** addresses, the next
  stop highlighted, with **Google Maps** and **Waze** buttons that open
  turn-by-turn navigation. Deactivated drivers can't log in.
- **Customer portal** (`/portal`): staff create customer accounts at
  `/admin/customers` (temporary password shown once). Customers log in, see
  their shipments, and request new orders, which staff approve or decline at
  `/admin/orders`.
- **Cancelling & rejecting** — a reason is always required and is shown to
  the other side. Staff *decline* pending order requests and can *cancel* any
  shipment that isn't delivered (from its admin page). Customers can cancel
  an order request still awaiting review straight away, but once an order is
  accepted they can only *request* cancellation (any time before delivery):
  it appears under **Cancellations** in the admin portal (with a count badge
  in the nav), where staff approve it (the shipment is cancelled) or reject
  it with a reason the customer sees. Cancelling a shipment directly also
  closes any open request for it. Cancelled shipments show a banner
  and the reason on the tracking page. Choosing a new status on a cancelled
  shipment reinstates it.
- **Forgot / change password** — customers use "Forgot password?" on the
  login page, which flags their account for staff (there's no email service
  wired up). Staff open the customer's page, click **Generate reset link**,
  and send the one-time link (valid 24 hours) to them; they choose their own
  new password. Logged-in customers can also change their password at
  `/portal/password`. To make reset emails automatic later, an email
  provider (e.g. Resend) would need to be added.

## Deployment

**Currently live at:** `https://shipment-portal-mgup.vercel.app` (Vercel's
free subdomain — no custom domain purchased/connected). The steps below are
what was already done, kept here for reference if this ever needs to be
redeployed or handed to someone else.

A custom domain (e.g. a subdomain of harmonydwc.ae) can be added later purely
in Vercel's **Settings → Domains** — nothing else changes, since the app and
the driver-app native app read the live URL from one place (see the "Point
the driver app at it" step below).

### 1. Push this project to GitHub

```bash
git init
git add .
git commit -m "Initial shipment tracking portal"
```

Create a new (private) repo on GitHub, then:

```bash
git remote add origin <your-new-repo-url>
git branch -M main
git push -u origin main
```

### 2. Create a Postgres database

1. Go to [neon.com](https://neon.com) (or use Vercel Postgres — see step 4),
   sign up, create a new project/database.
2. Copy the connection string it gives you (starts with `postgresql://`).
   Use the **pooled** connection string if offered one.

### 3. Create a Vercel Blob store

You'll do this from inside the Vercel project after step 4, in
**Storage → Create Database → Blob**. It gives you a `BLOB_READ_WRITE_TOKEN`
automatically wired into your project's environment variables — you won't
need to copy/paste it.

### 4. Deploy the project on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the GitHub repo.
2. Before deploying, add these Environment Variables:
   - `DATABASE_URL` — the Postgres connection string from step 2
   - `ADMIN_PASSWORD` — a strong password for your staff to log in with
   - `SESSION_SECRET` — any long random string (e.g. generate one at
     [1password.com/password-generator](https://1password.com/password-generator)
     or run `openssl rand -hex 32`)
   - `ANTHROPIC_API_KEY` — optional, from [console.anthropic.com](https://console.anthropic.com).
     Powers invoice/packing-list auto-fill; skip it and that feature just
     no-ops (document upload still works either way).
3. Click **Deploy**.
4. Once deployed, go to the project's **Storage** tab → **Create Database**
   → **Blob** → connect it to this project. This automatically adds
   `BLOB_READ_WRITE_TOKEN` to your environment variables.
5. Go to **Settings → Environment Variables**, confirm all four variables
   are set, then go to **Deployments** and redeploy (so the Blob token takes
   effect).
6. Run the database migration once against your new Postgres database:

   ```bash
   npx prisma migrate deploy
   ```

   (run this from your local machine with `DATABASE_URL` in `.env` pointed
   at the production database — or add it as a one-off command in Vercel's
   dashboard under the project's terminal/CLI if available).

### 5. (Optional) Point a custom domain at Vercel

Skipped for now — the free `.vercel.app` address is in use. To add one
later: Vercel project → **Settings → Domains** → add the domain → add the
CNAME record it shows you wherever that domain's DNS is managed. For
harmonydwc.ae specifically, DNS is managed at [tasjeel.ae](https://tasjeel.ae)
(the UAE's official `.ae` registry), not a typical registrar like GoDaddy.

### 6. Add a "Track Shipment" button to harmonydwc.ae

In WordPress admin, edit the page/header where you want the link (e.g. the
homepage hero, or the main menu):

- **Easiest**: add a new menu item under **Appearance → Menus** with:
  - Label: `Track Shipment`
  - URL: `https://shipment-portal-mgup.vercel.app`
- **Or**, in the block editor (Spectra), add a **Button** block with the
  same URL, styled to match your existing buttons.

No plugin or code changes are needed on the WordPress side. If a custom
domain gets connected later (step 5), just update this URL to match.

## Notes

- Admin auth is a single shared password (no per-staff accounts) — fine for
  one team; add real user accounts later if you need distinct staff logins.
- Deleting a shipment removes its database rows and event history but does
  not currently delete its photos from Blob storage — a minor cleanup task
  for later if storage usage matters.
- Driver location sharing relies on the phone's browser staying open and in
  the foreground — most mobile browsers pause `watchPosition` when the tab
  is backgrounded or the screen locks. Fine for a driver who keeps the page
  open during a delivery run; if always-on background tracking becomes a
  requirement, that needs a native/PWA app with background location
  permission instead of a browser tab.
- The driver's access link is a long random token that acts as their login
  (like the customer tracking number) — anyone with the link can post
  location updates as that driver, so treat it like a password and
  deactivate a driver (from their page in `/admin/drivers`) if their link
  ever leaks.
- Any Prisma schema change needs `package.json`'s `postinstall: "prisma
  generate"` to actually take effect on Vercel — Vercel caches
  `node_modules` between builds, so without it the generated Prisma Client
  can silently stay stale after a schema change and break the build. Don't
  remove that script.
- The invoice/packing-list OCR (`src/lib/ocr.ts`) calls Claude with the
  document as an image or PDF and asks for a small JSON object back — it's
  a best-effort read, not guaranteed accurate, which is why the extracted
  fields are editable on the shipment page rather than locked in.
