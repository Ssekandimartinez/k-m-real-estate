# K&M Real Estate — delivery report

Prepared 29 October 2026. Source repository: https://github.com/Ssekandimartinez/k-m-real-estate. Implementation is in the existing `main` checkout at `D:\K&M Real Estate`. No worktrees or additional assistants were used.

The application is implemented and exercised locally with real PostgreSQL persistence. It has not been deployed publicly. Production service credentials, a company administrator account and business publication checks are still required.

## 1. Pages developed

Home, About Us, Properties, property details, Services, individual service details, Materials & Supply Catalogue, individual supply item details, Projects, project details, Blog & Insights, article details, Contact Us, Request a Quote, Privacy Policy, Terms of Service and a 404 page. `/admin` includes login, password reset, dashboard and management modules.

## 2. Frontend features

React, Vite, TypeScript, Tailwind, React Router, TanStack Query, React Hook Form, Zod, Lucide and Motion. Responsive sticky navigation, accessible dropdown links and mobile menu, keyboard focus, reduced-motion support, self-hosted Inter/Manrope fonts, Burgundy & Sandstone styling and selected optimized company-supplied media. Original libraries are preserved. Fonts include redistribution licenses in `client/public/licenses`.

## 3. Backend features

Express/TypeScript REST API, real database reads and writes, server validation, public publishing filters, property search/sorting/pagination, request capture, staff authentication, role checks, media integration, SMTP integration, CSV exports and health checks. HTTP compression and static asset caching are enabled.

## 4. Database structure

PostgreSQL with Prisma 7.10.1 and the PostgreSQL driver adapter. Initial SQL migration is versioned in `server/prisma/migrations`. User, Session, PasswordReset, Category, Entry, EntryImage, CustomerRequest, Media, Setting and AuditLog models provide relationships, constraints, indexes and timestamps. Common editorial entities and request types share models; roles and permissions use enums and middleware. See [API.md](API.md) for the mapping and architectural differences from a separate-table-per-entity design.

## 5. Administration

Database-backed overview counts; properties; services; supplies; projects; rich-text articles; inquiries and quotations; media library; team profiles; verified testimonials; categories; company content/settings; staff accounts; audit history; password changes and logout. Administrators control accounts/settings/audits; staff manage editorial content, media and customer requests. No default public credentials are included.

## 6. Properties

Create/edit/delete/archive, draft/publish/unpublish, featured selection, galleries, category, location, USD/SSP pricing, sale/rent, bedrooms, bathrooms, area, amenities, availability, rental terms and SEO fields. Public search supports location, type, transaction, price bounds, currency, bedrooms, bathrooms, amenities and sorting. Details include gallery, area-search map link, inquiry and viewing request. Related listings appear when available. No exchange rates or precise coordinates are invented.

## 7. Services and catalogue

The seed contains **47 service records and 85 supply items**, across the six approved business groups, with **28 total editorial categories**. Structural Surveying appears under both relevant service groups using distinct URLs. Every record has a detail page and a consultation/quotation route. General supply items have browsable foodstuff, furniture, safety, stationery and relief groups. Prices and stock levels are not fabricated. Seeding handles either `*` or `-` Markdown bullets and preserves existing editorial changes; repeat seeding was checked.

## 8. Projects

Draft/publish/archive/delete, project category, location, rich description, gallery, status, verified completion date and services provided. Public portfolio and individual detail routes display published company records. No stock project has been represented as K&M’s completed work.

## 9. Blog

Article search and category filtering, individual articles and related content. Staff can use the Tiptap rich-text editor, assign categories, add a cover/gallery, edit metadata, feature, draft, publish, unpublish and delete. Submitted HTML is sanitized on the server. No market statistics or legal outcomes have been invented as launch articles.

## 10. Contact and quotation systems

General contact, property inquiry, viewing, consultation and quotation requests persist in PostgreSQL. Forms support contact details, service, location, requirements, quantities, consent and preferred viewing dates where applicable. Server-side validation, honeypot and rate limits apply. Staff can search/filter, add notes, change status, set follow-ups and export requests. Missing email configuration is disclosed after successful database storage; no email delivery is falsely claimed.

## 11. API endpoints

Public, authentication and staff endpoints are documented in [API.md](API.md). The same Node server serves the built website and API in production. Direct browser URL refreshes are handled by the server.

## 12. Security

Argon2 password hashing; random hashed session and reset tokens; HttpOnly/SameSite cookies with Secure and `__Host-` in production; exact-origin enforcement; per-session CSRF tokens; role checks; login and form rate limits; Helmet/CSP; request size limits; image decoding and size limits; HTML sanitization; CSV formula neutralization; administrative mutation audit records; generic server error responses; secrets excluded from Git. Password resets expire, are single-use and revoke sessions. Administrative responses are marked no-store.

This is not a claim of an independent penetration test or formal security certification. See operational limits below.

## 13. SEO

Server-generated titles, descriptions, canonical and Open Graph tags, social images, structured business data, sitemap, robots rules and crawlable content. The homepage hero and public detail pages render visible content before JavaScript. Public company/detail data is bootstrapped into Query cache to prevent an unnecessary loading transition. Staff pages are noindex and excluded from the sitemap. Analytics is optional, configured through company settings and gated by visitor consent.

## 14. Performance

Measured with Lighthouse’s default mobile simulation against the locally built application using installed Chrome. Homepage: **94 performance, 100 accessibility, 100 best practices, 100 SEO**. FCP 0.8 s, LCP 2.9 s, total blocking time 100 ms, CLS 0 in that run. These are local laboratory results; production hosting, latency, content and device performance will differ.

The representative Plumbing Installation detail page measured **87 performance, 100 accessibility, 96 best practices and 100 SEO** after reducing its initial layout shift and image sizes. It remains below the performance target of 90; further improvements should be guided by production measurements.

Form and staff editor bundles load separately. Motion feature imports are reduced to the required animation features. Images are WebP, the homepage has a smaller mobile hero source, fonts are local, assets are cached and responses compressed. Full local Lighthouse reports are in ignored `.local/`; selected measured evidence is in [verification.json](verification.json). No production field performance data is available.

## 15. Tests executed

TypeScript checks, ESLint and production build passed. **16 backend tests and 2 frontend tests passed.** Backend coverage includes real PostgreSQL CRUD, publishing, filtering, catalogue supply groups, request persistence and notes, exports, authentication, roles, origin/CSRF checks, password reset token consumption, session revocation, archive/delete and validation/sanitization. Frontend tests verify honest empty states and failed submissions remaining failures.

**6 Playwright browser tests passed** across desktop and iPhone-sized Chromium contexts: public navigation, responsive overflow, service detail links, property empty results, quote submission, server HTML metadata, staff login, article create/publish/unpublish/delete. Browser fixtures, temporary accounts and requests are cleaned up. Both browser contexts use installed desktop Chrome; this does not claim native Safari or Android hardware testing.

The database migration was applied successfully and schema validation passed. Dependency audit reported zero vulnerabilities, including the production-only audit. A GitHub Actions workflow is provided for PostgreSQL migrations, lint/type checks, unit/API tests, builds and browser tests; the remote workflow has not been run. Docker was not available, so a container build was not executed. Actual Cloudinary and SMTP round-trips could not be tested without credentials. Browser automation exercised unconfigured integration error behavior and persisted requests.

## 16. Outstanding configuration

Production PostgreSQL and backups, hosting/domain/HTTPS, SMTP, Cloudinary and the first administrator credentials. Optional: verified WhatsApp registration, official social profiles, Analytics ID and Search Console verification. No fabricated phone verification or social handles are published. Genuine property/project/team/testimonial records and approved articles should be added by staff as available.

## 17. Deployment

[DEPLOYMENT.md](DEPLOYMENT.md) covers environment variables, Docker/Node hosting, migrations, seeding, HTTPS, domain setup, CORS/origin configuration, health checks, logging, backup/restore, maintenance and Search Console. Production requires a valid HTTPS `SITE_URL`, exact `APP_ORIGIN` and PostgreSQL connection. Static-only hosting is insufficient for this application.

## 18. Administrator setup

Run `npm run admin:create` in an interactive terminal after migrations. Supply the company administrator’s name, email and a unique password of at least 12 characters. Password input is hidden. Sign in at `/admin`, then create named staff accounts as needed. Reset email requires SMTP. No permanent company administrator was invented during development; temporary test users were removed.

## 19. Known limits and publication checks

- The website is locally verified, not live or fully configured for production. Provider mail/media operations and Docker deployment still need environment-specific verification.
- Rate limiting uses an in-process store. Use a shared store for multiple instances. Expired session/reset cleanup and data retention need an operator-managed maintenance policy.
- Media replacement uses upload/select/save/delete. Gallery and settings references protect deletion; inline rich-text image references are not relationally tracked. Video validation checks the MP4 container signature, not a complete media scanning pipeline.
- Email status is recorded, but no background retry worker is included. Staff should review the dashboard when email is unavailable.
- Public company pages and detail content have server output; this is progressive server rendering with a React interactive client, not full React server rendering of every page component. Further content/route-specific optimizations can be guided by production measurements.
- Original supplied images may include third-party material. The company must confirm reuse permissions and genuine ownership claims before public launch. Policy text and any professional service claims need company approval for the actual operations.
- Original photos and approximately 4.97 GB of videos were already staged before development. They are preserved outside the application commits. No destructive Git operation or wholesale asset commit was performed. Changes are committed locally; no remote push or deployment is implied.
