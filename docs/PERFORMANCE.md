# Page loading performance

The public site continues to use the live Express API and PostgreSQL database.
Performance work does not replace published content with a static catalogue.

## Changes

- Responsive WebP derivatives at 320, 480 and 960 pixels cover existing public
  photography. Original files remain unchanged. `ResponsiveImage` selects the
  appropriate size, preserves image dimensions and handles new Cloudinary uploads
  through that provider's image transformations.
- Hero slides acquire their images when first selected. The first slide retains
  high fetch priority; the remaining slides no longer compete with it at startup.
- The testimonial animation bundle and inspiration section mount near the
  viewport. Video posters wait until their videos approach the viewport; video
  files still use `preload="none"` and require playback.
- Public settings and media metadata start downloading from the HTML before the
  application mounts. The same requests are reused by the API client.
- Content-hashed scripts, styles and responsive images have a one-year immutable
  browser cache. Other original assets retain the existing policy.
- Successful public API reads can be cached by Netlify for 30 seconds with up to
  60 additional seconds of background revalidation. All query parameters vary
  the cache, preserving property filters, pagination and sorting. Staff APIs,
  authentication, health checks, failed requests and submissions use `no-store`.
  Public changes may take up to 90 seconds to appear at a cached edge location;
  staff content management reads remain live.
- Image placeholders and a gallery loading layout reserve space while the API
  responds, reducing visible layout shifts.
- Offscreen listing cards defer rendering in supporting browsers. Animation
  discovery scans newly inserted content rather than repeatedly scanning the
  whole page. Loading placeholders reserve space before service data arrives.

Regenerate derivatives after adding local images:

```powershell
node scripts/prepare-responsive-images.mjs
```

Commit the generated image manifest and new responsive files together. Unknown
image URLs still work using their original files. Existing custom images, cloud
uploads, gallery pagination, property details and testimonial controls remain
supported.

## Measurement

On 29 October 2026, the live site was measured with Lighthouse 13.6's default
mobile simulation, cleared browser storage for each page, and the same profile for
before and after comparisons. Scores are lab measurements, not guarantees for
every device, network or visitor. The measured scores were:

| Page       | Mobile performance before | After |
| ---------- | ------------------------: | ----: |
| Home       |                        49 |    70 |
| Properties |                        83 |    85 |
| Services   |                        87 |    91 |

The homepage's simulated mobile LCP improved from 7.4 to 2.6 seconds, and its
initial transfer audit fell from 1,878,361 to 468,496 bytes (75% less). Properties
fell from 1,055,474 to 349,740 bytes; the gallery fell from 1,209,806 to 413,783
bytes. These transfer audits use a fresh 390px browser viewport, disabled browser
cache and a 5.5-second observation window after initial navigation. They are
separate from Lighthouse's simulated mobile timings.

Home and Properties remain below the 90-point target. Homepage startup work is
still a constraint: final Lighthouse total blocking time was about 1.1 seconds,
compared with 670 ms in the baseline, despite earlier visible content and smaller
downloads. This is not a claim that every page or every performance metric is
fully optimized. Raw timings also vary with network latency, CPU load and hero
carousel transitions.

Separate browser checks cover desktop/mobile rendering, responsive image
delivery, hero navigation, deferred animation loading, gallery filters and
pagination, property details, forms, and keyboard/reduced-motion behavior.

The existing free Render service can sleep after inactivity. A cold API start
can still delay live content when no valid CDN response is available. No paid
hosting change, keep-alive service or artificial uptime traffic was configured.

Implementation references: [responsive images](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img),
[offscreen rendering](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/content-visibility),
and [Netlify caching and query variations](https://docs.netlify.com/build/caching/caching-overview/).

Detailed measured metrics and download totals are recorded in [performance-results.json](performance-results.json). CPU benchmark indices are included because host load varies between runs; scores should be interpreted alongside FCP, LCP, blocking time and transferred bytes.
