# ShipTrack — Live Shipment Tracking Portal

A shipment tracking website with a staff admin panel and a public customer
tracking page, built for **harmonydwc.ae**. Staff upload photos and update
status for a shipment; the customer's tracking page polls automatically and
shows new photos live, no customer account required. Drivers can also share
their live GPS location from their phone's browser — no app install — which
customers see as a live map while their shipment is in transit.

## Stack

- Next.js (App Router, TypeScript)
- Tailwind CSS
- Prisma + Postgres (works with Neon, Vercel Postgres, Supabase, etc.)
- Vercel Blob for photo storage
- Leaflet + OpenStreetMap for the live map (no API key needed)
- Cookie-based admin session (single shared admin password)
- Driver location sharing via the browser Geolocation API (no app install)

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

5. Create the database tables:

   ```bash
   npx prisma migrate dev --name init
   ```

6. Run the dev server:

   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000).

## How it works

- **Customers**: go to the home page, enter their tracking number, and land
  on `/track/[trackingNumber]` — a live-updating page (polls every 6s) that
  shows shipment status, a status timeline, and a photo gallery.
- **Staff**: go to `/admin`, log in with `ADMIN_PASSWORD`, create a shipment
  (this generates a tracking number to give the customer), then open the
  shipment to upload photos and update its status. Each status change is
  logged to the shipment's history, which customers also see.
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
  pin.

## Deploying to Vercel + connecting it to harmonydwc.ae

This deploys the app to `track.harmonydwc.ae` as a subdomain of your
existing WordPress site — WordPress isn't touched except for adding one
button/link on the homepage.

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

### 5. Point track.harmonydwc.ae at Vercel

1. In the Vercel project, go to **Settings → Domains** and add
   `track.harmonydwc.ae`.
2. Vercel will show you a CNAME record to add, typically:
   - Type: `CNAME`
   - Name: `track`
   - Value: `cname.vercel-dns.com`
3. Add that record in whatever manages your DNS for `harmonydwc.ae` (your
   domain registrar, or Cloudflare if you use it). This does **not** affect
   your existing `harmonydwc.ae` or `www.harmonydwc.ae` records — it only
   creates the new `track.` subdomain.
4. Wait for DNS to propagate (usually minutes, sometimes up to an hour) and
   Vercel will show the domain as verified.

### 6. Add a "Track Shipment" button to harmonydwc.ae

In WordPress admin, edit the page/header where you want the link (e.g. the
homepage hero, or the main menu):

- **Easiest**: add a new menu item under **Appearance → Menus** with:
  - Label: `Track Shipment`
  - URL: `https://track.harmonydwc.ae`
- **Or**, in the block editor (Spectra), add a **Button** block with the
  same URL, styled to match your existing buttons.

No plugin or code changes are needed on the WordPress side.

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
