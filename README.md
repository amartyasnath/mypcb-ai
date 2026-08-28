# myPCB AI

An AI-powered recommendation engine that helps electronics engineers and hobbyists source
components (ICs, passives, connectors) from plain-text project requirements.

React 19 + Vite on the front end, Express on the back end, Google Gemini for
recommendations, Firebase for auth and chat history.

## Architecture

```
Browser (React SPA)
   │  POST /api/gemini      ── Express (server.ts) ── Google Gemini API
   │  POST /api/feedback    ── Express            ── Discord webhook (optional)
   │  POST /api/track       ── Express            ── Discord webhook (optional)
   └─ Firebase SDK (direct) ── Firebase Auth + Firestore (chat history)
```

The Gemini API key lives **only** on the server. The browser never sees it; it
talks to `/api/gemini`, which proxies to Google.

## Prerequisites

- **Node.js 20 or newer** (`node --version`)
- A **Gemini API key** — https://aistudio.google.com/apikey
- A **Firebase project** with Email/Password + Google auth and Firestore enabled

## Run locally

```bash
npm install
cp .env.example .env      # then fill in GEMINI_API_KEY
npm run dev               # http://localhost:3000
```

`npm run dev` starts Express with Vite in middleware mode, so the API and the
front end are served from the same origin on port 3000.

Verify the backend is wired up correctly:

```bash
curl http://localhost:3000/api/health
# {"status":"ok","model":"gemini-2.5-flash","geminiConfigured":true}
```

If `geminiConfigured` is `false`, your `.env` is not being read.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Express + Vite dev server with HMR on :3000 |
| `npm run build` | Builds the SPA to `dist/` and bundles the server to `dist/server.cjs` |
| `npm start` | Runs the production build (expects `dist/`) |
| `npm run lint` | Typechecks with `tsc --noEmit` |
| `npm run clean` | Removes `dist/` |

## Environment variables

Server-side only — see [.env.example](.env.example) for the full list.

| Variable | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | yes | Google Gemini API key |
| `GEMINI_MODEL` | no | Override the model (default `gemini-2.5-flash`) |
| `PORT` | no | Listen port; injected by most hosts (default `3000`) |
| `DISCORD_WEBHOOK_URL` | no | Forwards signups and feedback to Discord |

> Never prefix these with `VITE_` and never add them to `define` in
> `vite.config.ts` — either would inline the secret into the public client bundle.

## Deploying

The app builds to a single Node process serving both the API and static assets,
so any container host works.

```bash
npm ci
npm run build
NODE_ENV=production PORT=8080 npm start
```

### Pre-launch checklist

- [ ] `GEMINI_API_KEY` set in the host's secret store (not committed)
- [ ] Firebase Console → Authentication → Settings → **Authorized domains**:
      add your production domain, or Google sign-in will fail
- [ ] Firebase Console → restrict the web API key to your domain (HTTP referrers)
- [ ] Deploy `firestore.rules` (`firebase deploy --only firestore:rules`)
- [ ] Update the hardcoded `https://mypcb.ai/` URLs in `index.html`,
      `public/sitemap.xml`, and `public/robots.txt` if the domain differs
- [ ] Add a 1200×630 `public/og-image.png` for social link previews
- [ ] Confirm billing/quota limits on the Gemini API key

## Notes on limits

`/api/gemini` is unauthenticated and rate-limited in-process to 12 requests per
minute per IP. That counter is per-instance, so it resets on deploy and does not
coordinate across replicas — move to a shared store (or require auth) before
scaling horizontally.

Chat history is stored as a single Firestore document per conversation with the
messages inline. Firestore caps documents at 1 MiB, so very long conversations
will eventually fail to save; the server caps a request at 60 messages.
