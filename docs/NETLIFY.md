# Frontend-only Netlify website

The owner requested public content, images and videos without a backend.
`netlify.toml` enables `VITE_STANDALONE=true`, builds the client workspace and
publishes `client/dist`. Direct page URLs use the React route fallback.

Vite emits `/content/site.json` from the approved company/service catalogue and
the existing curated media manifests. It validates every media file and poster
at build time. No database, secret, customer record, demo listing, fabricated
project or testimonial is exported. Catalogue filters, detail pages and gallery
pagination run in the browser. Changes to these source files require a rebuild.

Enquiry links open the visitor's email application or telephone dialler. The
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
