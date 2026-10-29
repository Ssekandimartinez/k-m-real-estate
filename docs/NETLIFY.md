# Netlify frontend with the Render backend

Production uses `VITE_STANDALONE=false`. Public content, staff authentication,
editing and customer submissions use the Express API and PostgreSQL database.
Do not hardcode standalone mode in Vite: that disconnects published database
records from the public website and disables staff sign-in and submissions.

`netlify.toml` builds the client workspace and publishes `client/dist`. The
`/api/*` proxy to `https://km-real-estate-oregon.onrender.com/api/:splat` must
precede the React route fallback. Media remains served by Netlify; browser API
requests and secure session cookies remain on the Netlify origin. Render's
`APP_ORIGIN` and `SITE_URL` must both be `https://k-and-m-realestate.netlify.app`.
Publish and edit production content at that site's `/admin` address.

The bundled company/service catalogue remains available as an optional preview
with `VITE_STANDALONE=true`. Preview mode does not use the database, allow sign-in
or save submissions; it must not be used for the connected production site.
Bundled content excludes customer records, credentials and secrets. Published
records marked `specs.demo=true` are identified as illustrative properties or
design concepts when displayed from the live API.

All original media files are preserved. The collection is approximately 5 GB;
videos load on playback and may require substantial bandwidth.

Build locally from the repository root in PowerShell:

```powershell
node node_modules/typescript/bin/tsc --noEmit -p client/tsconfig.json
Set-Location client
node ../node_modules/vite/bin/vite.js build
node ../node_modules/vite/bin/vite.js preview --host 127.0.0.1
```

Verify `/api/health` on Netlify returns JSON, then verify content totals and
staff access. A successful static build alone does not verify the API connection.
See [RENDER.md](RENDER.md) for database transfer, free-plan expiry, Cloudinary
uploads and email configuration. A sleeping free backend can take longer to wake
than Netlify's proxy timeout; a first request after inactivity can require retry.
