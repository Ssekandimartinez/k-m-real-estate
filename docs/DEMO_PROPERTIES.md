# Local demo property inventory

The owner requested 15 published demo properties on 29 October 2026, without warning banners on the site. This is an explicit exception to the normal requirement to publish only verified property inventory.

Run `node scripts/publish-demo-properties.mjs` from the repository root to populate the local database. The importer rejects production environments and remote databases, skips existing slugs and leaves other content intact.

The titles, locations, prices, measurements, room counts and features are fictional demonstration data. Supplied photographs are illustrative. Records retain `specs.demo: true`, `verified: false` and references `KM-D001` through `KM-D015` for identification in administration and later replacement. This metadata adds no public warning banner.

The importer is separate from the normal company seed. It does not deploy the inventory to a hosted production site.

## Additional numbered images and projects

The owner subsequently requested more properties from images numbered 1–10 and ten projects. Run `node scripts/publish-demo-portfolio.mjs` from the root for this additional batch. It uses the four previously unused numbered images (`properyt 5.webp`, `properyt 7.webp`, `properyt 8.webp`, `prpoperyt 10.webp`) without duplicating the listings already using the other numbered photographs.

This adds references `KM-D016`–`KM-D019`, bringing the initial demo property inventory to 19. The ten demo projects use references `KM-P001`–`KM-P010`, two-image galleries and a Concept design status. They do not claim completed company work, clients, completion dates or achievements. Demo records remain identifiable through `specs.demo: true` and `verified: false`. Existing content is preserved and rerunning skips existing slugs.

## Category coverage

The owner authorised another 13 local demo properties to reach at least five published records per category. Run `node scripts/publish-demo-category-properties.mjs` to add references `KM-D020`�`KM-D032`: three offices, five commercial properties and five land entries. This importer rejects production and remote databases, preserves existing records, skips existing slugs, and retains `specs.demo: true` and `verified: false`. Land photographs show neighbourhood context rather than surveyed plot boundaries. The resulting category totals are House 10, Apartment 7, Office Space 5, Commercial 5 and Land & Plots 5.
