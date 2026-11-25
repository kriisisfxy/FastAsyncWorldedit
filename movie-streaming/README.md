# Nocturne — streaming platform

A full-stack movie and series streaming site: catalogue browsing, live search, accounts with watch history
and "continue watching", an integrated video player, and a separate admin studio for managing content and video sources.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Framer Motion · PostgreSQL · Prisma 6 · Auth.js v5 · zod · hls.js · Cloudinary (optional)

## Quick start

```bash
cp .env.example .env            # set DATABASE_URL and AUTH_SECRET (openssl rand -base64 32)
npm install
npx prisma migrate deploy       # or: npm run db:migrate (development)
npm run db:seed                 # demo catalogue, admin + viewer accounts
npm run dev                     # http://localhost:3000
```

| Account | Email | Password |
|---|---|---|
| Admin | `SEED_ADMIN_EMAIL` (default `admin@example.com`) | `SEED_ADMIN_PASSWORD` (default `ChangeMe123!`) |
| Viewer | `viewer@example.com` | `Viewer123!` |

Change both before deploying anywhere public. The admin studio is at `/admin`.

The seed needs **ffmpeg** to generate the playable demo clips. Without it the catalogue is still seeded, but nothing is playable until you add sources.

## Videa integration — what it does and does not do

Videa (videa.hu) does not publish a documented public API that this project could verify, so:

- **No Videa API endpoints are called and no stream URLs are extracted.** The integration does not scrape, re-host or bypass anything.
- The Videa provider (`src/lib/providers/videa.ts`) only renders **Videa's own embeddable player** in an iframe. In the admin panel you paste the code from the **Embed / Beágyazás** option on a Videa video page (the whole `<iframe …>` or just its `src`).
- The URL is validated: it must be `https://` and on `videa.hu` / `www.videa.hu`. The CSP `frame-src` allows only the hosts that registered providers declare.
- Because the embedded player is cross-origin, the provider's own controls run inside it. Nocturne records that a title was started (for history), but **it cannot read the exact playback position or drive the iframe's controls**. Exact resume, custom controls, subtitles and speed control apply to *direct file* sources.
- Videa's own terms, ads, access rules and takedowns still apply to embedded videos. **Only add videos you have the right to publish.**

### Adding another provider

1. Create `src/lib/providers/<name>.ts` implementing `VideoProviderModule` (`normalize` validates admin input, `resolve` returns `{ kind: "file" | "embed", url }`, `frameHosts` lists iframe origins).
2. Register it in `src/lib/providers/index.ts`.
3. Add the value to the `VideoProvider` enum in `prisma/schema.prisma` and run a migration.

Nothing else in the app needs to change: the player, admin forms and CSP read from the registry.

## Architecture

```
prisma/
  schema.prisma          relational model (users, movies, genres, movie_genres, actors, movie_cast,
                         video_sources, subtitles, series, seasons, episodes, watch_history, watchlist,
                         ratings, password_reset_tokens)
  migrations/            init + integrity checks (CHECK constraints, lower() indexes)
  seed.ts, demo/         demo catalogue, generated poster art (art.ts) and clips (media.ts)
src/
  auth.ts, auth.config.ts, middleware.ts   Auth.js credentials login, JWT sessions, role-based route guard
  lib/
    db.ts                Prisma client singleton
    validation.ts        zod schemas for every input
    http.ts              API handler wrapper: errors → JSON, same-origin check on mutations
    session.ts           requireUser / requireAdmin (checked again in every API route)
    providers/           video provider registry (videa, direct)
    storage.ts           image uploads: Cloudinary or public/uploads, with file-signature checks
    mail.ts, rate-limit.ts, playback.ts, browse.ts, utils.ts
  services/
    catalog.ts           browse, search, rows, recommendations, details
    library.ts           history, continue watching, watchlist, ratings
    admin.ts             create/update movies & series (cast, genres, sources), site stats
  app/
    (site)/              public pages: home, movies, series, genres, recent, search, details, profile, my list
    (auth)/              login, register, forgot/reset password
    watch/               full-screen player pages (movie, episode)
    admin/               admin studio with sidebar: overview, movies, series, sources, genres, users
    api/                 REST endpoints: /api/search, /api/register, /api/password/*, /api/me/*, /api/admin/*
  components/            ui, layout, media cards/rows/hero, search overlay, player, account, admin
```

### REST API

| Method | Path | Who | Purpose |
|---|---|---|---|
| GET | `/api/search?q=` | anyone | live search (movies, series, people) |
| POST | `/api/register` | anyone | create account |
| POST | `/api/password/forgot`, `/api/password/reset` | anyone | password recovery (1-hour single-use token, stored hashed) |
| POST | `/api/me/progress` | user | save playback position |
| POST | `/api/me/watchlist`, `/api/me/ratings` | user | toggle list item, rate 1–10 |
| PATCH / POST | `/api/me/profile`, `/api/me/avatar` | user | name/password, profile picture |
| POST/PUT/PATCH/DELETE | `/api/admin/movies[/:id]`, `/api/admin/series[/:id]`, `/seasons/:id`, `/episodes[/:id]`, `/genres[/:id]`, `/users/:id`, `/upload` | admin | content and user management |

### Player

- **Direct sources (MP4/WebM/HLS):** custom controls (play/pause, ±10 s, volume with memory, scrubbable timeline with buffer, speed, subtitles, fullscreen including iOS), loading and error states with retry or "try another source", touch gestures (tap to show controls, double-tap the sides to seek), keyboard shortcuts (space/k, j/l/arrows, m, f, c). Position is saved every 15 s, on pause and when the page closes, to the account (or localStorage for guests).
- **Series:** "Up next" card in the final 20 seconds and a 5-second autoplay countdown to the next episode (also across seasons).
- **Embed sources (Videa):** the provider's player inside the Nocturne player shell, with a loading state, a slow-load fallback and source switching.

### Security

- Passwords hashed with bcrypt (cost 12); login rate-limited per email; timing-equalised for unknown accounts.
- Middleware blocks `/admin`, `/api/admin`, `/api/me`, `/profile` and `/my-list` by role, and every API route re-checks the role on the server.
- Every input is validated with zod. State-changing requests from another origin are rejected, and Auth.js cookies are SameSite=Lax.
- Content-Security-Policy, nosniff, a referrer policy and `frame-ancestors 'none'`.
- Uploads are checked by magic bytes (JPG/PNG/WebP/AVIF) and limited to 8 MB.
- Disabled users lose their session within 5 minutes. Admins cannot demote or disable themselves, or remove the last admin.
- The in-memory rate limiter suits a single instance; use Redis (e.g. Upstash) when you run several.

## Demo content

- **Nocturne Test Reel** and the **Night Shift** series are original clips generated with ffmpeg. They are the only playable titles out of the box: the reel has an MP4 source, an HLS source and English subtitles, and the series exercises next-episode.
- The Blender open movies (CC BY) and the classic films (generally public domain in the US, but status varies by country) are listed **without video sources**. Add sources you have verified in the admin panel.
- Posters and backdrops are generated SVG artwork, not studio images. IMDb ratings are approximate demo values: verify them before going live.
