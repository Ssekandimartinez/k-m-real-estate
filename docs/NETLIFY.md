# Frontend-only Netlify website

The public website bundles its approved company details, service and supply
catalogue, and curated image/video placements directly into the frontend code.
It does not fetch public content from Express, PostgreSQL, or a separate JSON
endpoint. The Vite configuration always selects this mode, even if a hosting
environment has an old VITE_STANDALONE=false setting.

`netlify.toml` builds the client workspace, publishes `client/dist`, and routes
direct page URLs through React. There is no Render API redirect. Admin changes
do not affect public content. Update `server/prisma/approved-content.ts`, the
approved catalogue source, or the curated media manifests and redeploy to change
public content. Vite validates media files and posters when building. It also
emits `content/site.json` as a build inspection artifact; the website does not
request it.

Catalogue search, filtering, detail pages and gallery pagination run locally.
Enquiry links open the visitor's email application or telephone dialler. No
submission is saved by the website, and staff sign-in is unavailable. Genuine
properties, projects, posts and testimonials are not invented or copied from
development demonstration inventory. No customer records or secrets are bundled.

All original media files are preserved. The collection is approximately 5 GB;
videos load on playback and may require substantial bandwidth.

Build locally from the repository root in PowerShell:

```powershell
node node_modules/typescript/bin/tsc --noEmit -p client/tsconfig.json
Set-Location client
node ../node_modules/vite/bin/vite.js build
node ../node_modules/vite/bin/vite.js preview --host 127.0.0.1
```

The retained backend can be operated separately, but it does not supply or edit
the public website content.
