# Netlify frontend with Render API

The production frontend is `https://k-and-m-realestate.netlify.app` and its
backend is `https://km-real-estate-oregon.onrender.com`. `netlify.toml` enables
`VITE_STANDALONE=false`, builds the client workspace and publishes `client/dist`.
The API proxy rule precedes the React route fallback. Media remains served by
Netlify. API requests remain on
the Netlify browser origin, preserving secure HTTP-only administration cookies.
Render must allow that exact Netlify origin through `APP_ORIGIN`; `SITE_URL` also
uses the Netlify address for canonical URLs and password reset links.

The remaining notes describe the optional standalone preview, which is not the
connected production configuration. Its static catalogue is not the production
database. Use [RENDER.md](RENDER.md) for the free Render database and deployment
limits, initial administrator creation and external service configuration.

Vite emits `/content/site.json` from the approved company/service catalogue and
the existing curated media manifests. It validates every media file and poster
at build time. No database, secret, customer record, demo listing, fabricated
project or testimonial is exported. Catalogue filters, detail pages and gallery
pagination run in the browser. Changes to these source files require a rebuild.

In standalone preview mode, enquiry links open the visitor's email application or telephone dialler. The
website does not save enquiries or claim they were delivered. Staff login and
content editing require the separate backend deployment and are unavailable here.
Properties, projects, blog posts and testimonials remain empty until genuine
approved content is supplied; development demonstration inventory is excluded.

The media collection is approximately 5 GB. Videos retain their original quality
and load only when played; large videos require substantial bandwidth. Original
files are preserved. A working frontend does not verify Netlify upload completion
or browser playback of every clip on every device.

For a local standalone build in PowerShell:

```powershell
$env:VITE_STANDALONE = 'true'
node node_modules/typescript/bin/tsc --noEmit -p client/tsconfig.json
# Run from client/ to avoid Windows npm shim issues with the ampersand in the path:
Set-Location client
node ../node_modules/vite/bin/vite.js build
node ../node_modules/vite/bin/vite.js preview --host 127.0.0.1
```

The existing Express/database application remains available for full-stack hosting
when `VITE_STANDALONE` is unset. See `DEPLOYMENT.md`.
