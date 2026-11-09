# SEO release — 9 November 2026

The technical SEO implementation is deployed at https://kmrealestatecompany.com/.
Backend application commit: `307d6aa`. Netlify's public routing points to the
matching server-generated HTML and bundles; original media remains on Netlify.

## Implemented

- Database-backed HTML for main pages, published detail pages and six service
  category pages, available before JavaScript runs.
- Page titles, descriptions, canonical URLs, Open Graph and Twitter metadata;
  matching updates during React navigation.
- RealEstateAgent, WebSite and breadcrumb structured data using company records.
- A live XML sitemap with 160 canonical URLs. Drafts, archived entries and
  entries explicitly marked as demos are excluded.
- Robots rules that permit public resources; noindex for staff, missing pages
  and demo detail pages. Missing pages return HTTP 404.
- HTTP 301 redirects from www and the previous Netlify address to the custom
  domain. Trailing-slash URLs resolve with normalized canonical metadata.
- The owner's HTML verification tag remains in the source and deployed HTML.
- Render's APP_ORIGIN and SITE_URL match the custom domain. Other environment
  variables, credentials and existing content were preserved.

## Verification

All 160 sitemap URLs returned HTTP 200, rendered headings and descriptions,
matching canonical URLs and no noindex header. Public checks also passed for
robots.txt, sitemap content type, parsed structured data, both domain redirects,
staff indexing protection, demo exclusions and genuine 404 responses.

A mobile Chrome browser check passed for navigation, metadata updates and layout
width, with no uncaught JavaScript errors. The database health check passed.
An empty enquiry request from the custom domain returned HTTP 400 validation,
without creating a customer submission.

The final application's [CI run](https://github.com/Ssekandimartinez/k-m-real-estate/actions/runs/42601112108)
passed typechecks, lint, build, 70 unit/API tests (including PostgreSQL workflows)
and 10 desktop/mobile end-to-end tests. CI installation now includes the platform
build tools instead of suppressing the esbuild install script.

## Lighthouse measurement

Lighthouse 13.6.0, mobile with simulated throttling, measured
9 November 2026 at 13:33 EAT on the final deployed homepage.

| Category       | Score |
| -------------- | ----- |
| Performance    | 94    |
| Accessibility  | 100   |
| Best Practices | 100   |
| SEO            | 100   |

First Contentful Paint: 1.2 s; Largest Contentful Paint: 2.0 s; Total Blocking Time: 240 ms; Cumulative Layout Shift: 0.

An earlier run had a trace-recording error; a retry and this final run completed
successfully. Scores vary between runs.

Local raw evidence is retained in `.local/seo-lighthouse.json`,
`.local/seo-live-audit.json` and `.local/seo-sitemap-audit.json`.

## Owner actions and limits

In Search Console, finish HTML-tag verification if necessary, submit
`https://kmrealestatecompany.com/sitemap.xml`, and inspect/request indexing for
the homepage. Account verification, submission, Google indexing and ranking have
not been claimed as completed by this release. See [SEARCH_CONSOLE.md](SEARCH_CONSOLE.md).

The free Render backend can sleep, so a first request after inactivity may be
slow or time out. Lighthouse results are a lab measurement, not field Core Web
Vitals or a ranking guarantee. No paid hosting changes were made.

Production email delivery, uploads and password-based staff sign-in were not
retested in this SEO release. CI covers staff authentication and enquiry persistence;
it does not verify production delivery or media-provider credentials.
No original assets were removed and no invented company content was added.
