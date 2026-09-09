# myPCB AI

The original React/Vite website with its existing green, gold and cream theme,
backed by Express. Free sample chat uses the original recommendation cards and
Excel BOM export. No API key is required for demo mode.

## Run locally

Requires Node.js 20 or newer. From this folder in PowerShell:

```powershell
npm.cmd ci
npm.cmd run dev
```

Open http://localhost:3000. Use `npm.cmd` on Windows if PowerShell blocks `npm`.
No Python or Streamlit server is needed. Start from the landing page and open
the component sourcing chat. Guest chat does not require signing in.

`DEMO_MODE` defaults to `true`, even if an API key is present. The original chat
shows a sample-mode notice and returns fixed illustrative cards. Sample parts
are not matched to requirements; pricing, stock and suitability are unverified.
Use the existing Export BOM button to download recommendations as Excel.

## Build and run production

```powershell
npm.cmd run lint
npm.cmd run build
$env:NODE_ENV = 'production'
npm.cmd start
```

`npm run preview` serves only the frontend and does not provide the chat API.
The included Dockerfile builds and runs the complete Node app. Deploy it to a
Node/container host using `npm ci && npm run build` as the build command and
`npm start` as the start command, with `NODE_ENV=production` and `DEMO_MODE=true`.
The server uses the host's `PORT` variable. Streamlit Community Cloud is not the
hosting target for this React/Express website.

## Optional services

Copy `.env.example` to `.env` without overwriting an existing file.

- Live AI: set `DEMO_MODE=false`, `ANTHROPIC_API_KEY`, and a `CLAUDE_MODEL` supported
  by your Anthropic account, then restart. Without a key, live mode returns
  **API key required**. Live API/model compatibility was not tested. API usage
  and web search incur separate charges; a Claude subscription is not API access.
- `MAX_WEB_SEARCHES` caps searches per reply (default 6). Before enabling paid AI
  publicly, add authenticated usage quotas and provider budget controls.
- Firebase auth/history: configure your own `firebase-applet-config.json`, auth
  providers, authorized domains and Firestore rules before relying on sign-in.
- Contact delivery: configure `DISCORD_WEBHOOK_URL`. The existing contact form
  reports an error if delivery is unconfigured or fails.

Keys stay server-side. Never put them in `VITE_` variables or commit `.env`.
`/api/health` reports `demoMode` and key configuration. `/api/chat` has an
in-process limit of 12 requests per minute per IP.

## Next features for the existing website

1. Manufacturer sponsorship inquiries with labeled paid placements and lead reports.
2. Structured requirements filters for voltage, interfaces, footprint and budget.
3. Side-by-side comparisons with datasheet evidence and compatibility gaps.
4. Distributor stock/price comparisons with timestamps and alerts.
5. Saved project BOMs with quantities, revisions and shareable review links.

## Validation

Typechecking and production build pass; the build has a nonblocking bundle-size
warning. Local HTTP checks passed for sample chat, health, unconfigured contact
and live mode without a key. Browser visual review, Firebase sign-in and paid AI
were not tested. The original theme, fonts, landing page and layout are preserved.

## Demo additions and phone link

Sample searches now select LDO, MOSFET, microcontroller or op-amp example cards.
Unrecognized categories show a labeled fallback; electrical requirements are not
validated. Select Compare checkboxes to build a comparison table and use Export
selected BOM. The manufacturer dialog includes a downloadable partnership brief;
it does not submit an inquiry. Original theme and layout remain in place.

For a temporary public phone demo, run the production app with DEMO_MODE=true,
then `.\.tools\cloudflared.exe tunnel --url http://127.0.0.1:3000 --no-autoupdate`.
Use the HTTPS address printed by cloudflared. Keep the computer awake and both
processes running; the link expires when the tunnel stops. This is not permanent
hosting. The current shared demo uses port 3010 with AI/webhook credentials cleared.
