# Link Outpost

Cloudflare Workers + React app for personal link pages.

## Routing model

- `/` is served as a static asset.
- `/admin` and `/admin/*` are served as static assets and run the client-side editor.
- `/assets/*` is served directly by Workers Static Assets.
- `/api/*` runs in the Worker.
- `/:handle` runs in the Worker and server-renders a public profile page.

The routing boundary is controlled by `assets.run_worker_first` in `wrangler.jsonc`.

## Editor modes

The `/admin` editor uses the same UI in both modes:

- Offline mode: used when the backend is unavailable or the user is not logged in. Data is saved in IndexedDB, and the editor can export a static ZIP containing `index.html`, `styles.css`, `profile.json`, and local image assets.
- Backend mode: used when a backend session is present and a D1 binding exists. Data is saved to D1 and can be rendered at `/:handle`.

Backend sessions are created through Google or Twitter/X OAuth. The Worker stores a signed `linkoutpost_session` cookie after the OAuth callback completes.

## OAuth setup

Create OAuth apps for Google and Twitter/X, then configure these callback URLs:

```txt
https://<your-domain>/api/auth/google/callback
https://<your-domain>/api/auth/twitter/callback
```

For local testing, also allow:

```txt
http://localhost:8787/api/auth/google/callback
http://localhost:8787/api/auth/twitter/callback
```

Set secrets in Cloudflare:

```bash
npx wrangler secret put AUTH_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put TWITTER_CLIENT_ID
npx wrangler secret put TWITTER_CLIENT_SECRET
```

Google uses OpenID Connect scopes `openid email profile`. Twitter/X uses OAuth 2.0 Authorization Code with PKCE and scopes `users.read tweet.read`.

## Browser storage choice

The offline editor uses IndexedDB as the primary browser store:

- `localStorage`: simple and synchronous, but too small for images, blocks the main thread, and only stores strings. It is kept only as a legacy/fallback profile store.
- `sessionStorage`: same limitations as `localStorage`, and data disappears when the browser session ends. Not appropriate for an editor.
- IndexedDB: asynchronous, stores structured JSON and `Blob` objects, and is the right fit for offline profile data plus images/assets.
- Cache Storage: useful for HTTP response caching and offline app shells, but awkward as the canonical editable data store.
- File System Access API: useful for explicit user-managed files, but browser support and permission UX are not a good default for this editor.

Local profile JSON and uploaded image blobs are stored in IndexedDB. Static ZIP export reads the same local profile and image blobs, then writes a self-contained deployable archive.

## D1 setup

Create a D1 database and add the binding to `wrangler.jsonc`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "linkoutpost",
    "database_id": "<your-d1-database-id>"
  }
]
```

Apply the schema:

```bash
npx wrangler d1 migrations apply linkoutpost --local
npx wrangler d1 migrations apply linkoutpost --remote
```

## Development

```bash
npm install
npm run build
npm run dev
```
