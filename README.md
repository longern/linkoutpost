# LinkOutpost

Cloudflare Workers + React app for personal link pages.

## Code map

- `src/pages/`: application routes. The editor page composes the focused modules under `src/pages/editor/`.
- `src/pages/editor/links/`: link rows, media previews, editing, and drag-sort behavior.
- `src/features/profile/`: the shared public profile renderer used by hosted SSR, editor previews, and static exports.
- `src/media/`: shared upload kinds, limits, MIME mappings, and browser image resizing.
- `src/oembed/`: provider-specific and generic oEmbed resolution.
- `src/worker/`: Worker authentication, D1 profile persistence, R2 asset storage, and HTTP helpers. `src/worker.tsx` is the routing and SSR entrypoint.
- `src/styles/`: global application styles split by surface. Public profile styles live with the profile feature because static exports reuse them.
- `src/profile.ts`: the shared profile data model, normalization, defaults, and social platform definitions.
- `src/staticExport.tsx` and `src/staticImport.ts`: the portable ZIP boundary.

## Routing model

- `/` is served as a static asset.
- `/admin` and `/admin/*` are served as static assets and run the client-side editor.
- `/privacy`, `/terms`, and `/license` are served as static assets and run the client-side app.
- `/assets/*` is served directly by Workers Static Assets.
- `/api/*` runs in the Worker.
- `/:handle` runs in the Worker and server-renders a public profile page.

The routing boundary is controlled by `assets.run_worker_first` in `wrangler.jsonc`.

## Editor modes

The `/admin` editor uses the same UI in both modes:

- Offline mode: used when the backend is unavailable or the user is not logged in. Data is saved in IndexedDB, and the editor can export a static ZIP containing `index.html`, `styles.css`, `profile.json`, and local image assets.
- Backend mode: used when a backend session is present and a D1 binding exists. Data is saved to D1 and can be rendered at `/:handle`.

Backend sessions are created through Google, Twitter/X, or Shopify Customer Account OAuth. The Worker stores a signed `linkoutpost_session` cookie after the OAuth callback completes.

## OAuth setup

Create OAuth clients for the providers you want to enable, then configure these callback URLs:

```txt
https://<your-domain>/api/auth/google/callback
https://<your-domain>/api/auth/twitter/callback
https://<your-domain>/api/auth/shopify/callback
```

For local testing, also allow:

```txt
http://localhost:8787/api/auth/google/callback
http://localhost:8787/api/auth/twitter/callback
```

Shopify Customer Account API callbacks must use HTTPS, so local Shopify login needs an HTTPS tunnel whose callback ends in `/api/auth/shopify/callback`.

Set secrets in Cloudflare:

```bash
npx wrangler secret put AUTH_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put TWITTER_CLIENT_ID
npx wrangler secret put TWITTER_CLIENT_SECRET
npx wrangler secret put SHOPIFY_STOREFRONT_DOMAIN
npx wrangler secret put SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID
npx wrangler secret put SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET
```

For Shopify, enable customer accounts, add the Headless channel, create a confidential Customer Account API client, and register the production callback URL. `SHOPIFY_STOREFRONT_DOMAIN` is the storefront domain used for Shopify's discovery endpoints, for example `shop.example.com`.

Google uses OpenID Connect scopes `openid email profile`. Twitter/X uses OAuth 2.0 Authorization Code with PKCE and scopes `users.read tweet.read`. Shopify uses the discovered Customer Account OAuth endpoints with scopes `openid email customer-account-api:full`.

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

## File storage setup

Backend-mode uploaded and generated files, including avatar uploads, are stored in R2. Create a bucket:

```bash
npx wrangler r2 bucket create linkoutpost-files
```

Add the binding to `wrangler.jsonc`:

```jsonc
"r2_buckets": [
  {
    "binding": "BUCKET",
    "bucket_name": "linkoutpost-files"
  }
]
```

## Development

Optional build-time environment variables:

- `VITE_SITE_TITLE`: site name shown in the UI. Defaults to `LinkOutpost`.
- `VITE_HOSTED_HANDLE_MIN_LENGTH`: minimum handle length for hosted/backend publishing. Defaults to `5`.

```bash
npm install
npm run build
npm run dev
```
