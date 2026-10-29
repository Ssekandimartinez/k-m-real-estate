# Image allocation

The 205 files in `images` contain 200 distinct non-branding photographs already
represented in the public media library. Duplicate source copies and branding
files are accounted for in `media-library.json`; original files are preserved.

The October 2026 audit identified 122 photographs not assigned to content or
page sections outside the gallery. Optimized WebP copies are available in
`client/public/images/available`, with source names, descriptions, subjects and
current allocations recorded in `image-allocation.json`.

Use `node scripts/prepare-available-images.mjs` to regenerate these copies and
`node scripts/check-image-allocation.mjs` to check the allocation and files.
The existing public library URLs remain valid, including for the live content
substitutions. Keeping an additional file available does not display it twice.

The update replaces 69 entry-image links with curated library photos, reserves
photos assigned to content from the gallery, gives service planning sections
their own images, and removes repeated decorative CTA and related-navigation
photos. Original property photos remain attached to their listings. A record's
photo remains consistent between its card and detail page.

The owner explicitly requested keeping existing photos where no relevant unique
replacement exists. `retainedSharedPhotos` documents these exceptions. Do not
claim that the whole website has no repeated photos. Do not substitute a photo of
another building for a listing or use unrelated product imagery to make it unique.

Before assigning another photo, check its source ID and `assignedTo` list in the
allocation file. Use an unassigned photo with a relevant subject. Update the
allocation and visual-media placement together so gallery photos do not repeat
content images. New content and manual image changes require another allocation
check; this document is an audit snapshot, not an automatic publishing constraint.
