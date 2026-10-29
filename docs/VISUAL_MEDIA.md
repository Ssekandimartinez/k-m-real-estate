# Visual media collection

The supplied folders contain 205 images and 119 videos. The site uses 200 distinct photographic images and 117 distinct video clips. Two branding files remain in the branding system; five exact duplicate copies are recorded in `media-library.json` and displayed only once. Original files are preserved.

`media-curation.json` assigns descriptive captions, subjects and exclusive placements. Each asset belongs either to one named page placement or to the paginated `/gallery` collection. The homepage links to the gallery; it is also accessible from the Services menu and footer. Gallery items are not repeated in page sections. The collection is illustrative and is separate from verified property and project records.

The public `/api/visual-media` endpoint reads the `visual-media` PostgreSQL setting. The homepage receives the same database content in its initial HTML. Videos have individual frame posters, use `preload="none"`, start muted, and pause other clips when played. Photos are resized and encoded as WebP. The supplied video files retain their original quality and total approximately 4.9 GB; they download only on playback.

To prepare a fresh deployment, run `node scripts/prepare-media-library.mjs` from the repository root (requires installed Chrome for poster extraction), then `node scripts/publish-media-library.mjs` with the intended database configured in `server/.env`. Run `node scripts/task.mjs build` to include the assets in the build. Publishing only upserts the media setting and does not change company records or genuine listings. Re-review curation when adding, removing or renaming originals, since inventory IDs follow source sort order.

The asset coverage tests verify that every supplied non-branding file is represented, duplicate copies are accounted for, each page placement is exclusive, and all files and posters exist. The gallery test verifies pagination, category filtering and exclusion of page-assigned images.

Validation completed: 20 backend tests (including PostgreSQL API tests) and 14 frontend tests passed. The browser audit traversed all page placements and gallery pages, observed all 317 assets, and reported no missing media, repeated media locations, broken images or horizontal overflow. Desktop and 390px mobile layouts were checked. Video playback and mutual pausing worked, and no MP4 request was made before playback. Lint and the full production build passed.
