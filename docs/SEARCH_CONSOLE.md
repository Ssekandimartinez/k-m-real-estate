# SEO and Google Search Console

The intended public origin is https://kmrealestatecompany.com. These repository
changes require deployment; they do not verify ownership or submit anything to Google.

## Deployment order

1. Deploy the Render backend using the updated Dockerfile. It now builds both the
   client template/assets and API. The large media library stays on Netlify;
   `KM_BUILD_WITHOUT_MEDIA=true` skips media-file existence checks in this build
   only. Netlify's normal build still validates the media library.
2. Set Render's `APP_ORIGIN` and `SITE_URL` to
   `https://kmrealestatecompany.com` (no trailing slash). The non-secret Blueprint
   values are updated; existing Dashboard settings must also be applied.
   Preserve database, media, email and authentication secrets.
3. Deploy Netlify with the updated routing. Public HTML, robots.txt and sitemap.xml
   reach Express. Existing public media files remain served by Netlify. JavaScript
   and CSS are proxied to Render to match its HTML even during separate deployments.
4. In Netlify Domain management, make kmrealestatecompany.com the primary domain
   and check HTTPS. Redirect www and the old Netlify address to the primary domain.
5. Verify the homepage and detail pages contain relevant text, canonical metadata
   and JSON-LD in View Source with JavaScript disabled. Check /robots.txt is plain
   text and /sitemap.xml is XML with the custom-domain URLs. Confirm an unknown
   page returns HTTP 404 and staff pages send X-Robots-Tag: noindex, nofollow.
6. Check staff sign-in, public API access and a real inquiry after the origin change.

The free Render backend can sleep. Proxy timeouts can affect both visitors and
crawlers; monitor live responses before submitting URLs. No paid plan is enabled
by these changes. No Lighthouse score or Google indexing is claimed.

## Verify the Domain property

The owner chose HTML-tag verification for the HTTPS URL-prefix property.
The exact owner-provided verification tag is retained in `client/index.html`
and survives both Vite builds and server rendering. In Search Console, verify
`https://kmrealestatecompany.com/`, then submit the sitemap and request homepage
indexing using the steps below. Verification success is visible only in the
owner's Search Console account. Keep the tag after verification.

Domain-property verification through DNS remains an optional alternative:

1. Sign in at https://search.google.com/search-console/ using the owner's Google account.
2. Add property, choose Domain, enter `kmrealestatecompany.com` without https or paths.
3. Copy the exact `google-site-verification=...` TXT value Google provides.
4. In Netlify Team dashboard > DNS > kmrealestatecompany.com, add a TXT record
   for the root domain (use the root hostname field convention shown by Netlify).
   Paste Google's value unchanged and save. Keep all existing records.
5. Return to Search Console and click Verify. DNS changes may need time; leave
   this record in place after successful verification.
6. In Sitemaps submit `https://kmrealestatecompany.com/sitemap.xml` after confirming
   the live endpoint serves XML successfully.
7. Use URL Inspection for `https://kmrealestatecompany.com/`, run Test Live URL,
   review crawl/indexing eligibility and choose Request indexing if eligible.
8. Monitor Page indexing and sitemap processing. Requesting indexing does not
   guarantee inclusion, ranking or a specific timeline.

Only genuine published company records should enter search results. Review any
illustrative/demo inventory in the administration interface before publication.
Do not publish fabricated property availability, testimonials or achievements.

References: [Google ownership verification](https://support.google.com/webmasters/answer/9008080),
[Google crawl requests](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl),
[Netlify proxy behavior](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/).
