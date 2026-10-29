# Deployment and operations

## Prerequisites

Configure a PostgreSQL database, a domain, an HTTPS reverse proxy, Cloudinary persistent storage and an SMTP account. Do not copy development credentials into production. Use Node 22 LTS, install dependencies from the lockfile, and keep secrets outside Git.

The application is prepared for a Node/Docker host, rather than static-only hosting. PostgreSQL and Express require an appropriate application host. No external deployment has been made by this implementation.

## Environment

Use `server/.env.example` as the template. Essential values:

| Variable                                                               | Purpose                                                                       |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `DATABASE_URL`                                                         | PostgreSQL connection string; use TLS according to provider guidance          |
| `NODE_ENV=production`                                                  | Secure cookies and production configuration validation                        |
| `APP_ORIGIN`                                                           | Exact visitor HTTPS origin, without trailing slash                            |
| `SITE_URL`                                                             | Public HTTPS origin used for canonical URLs, sitemap and password reset links |
| `PORT`                                                                 | Node port, default 4000                                                       |
| `TRUST_PROXY_HOPS`                                                     | Trusted reverse proxy hop count; leave 0 without a proxy                      |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`    | Request notification and password reset mail                                  |
| `NOTIFY_EMAIL`                                                         | Staff notification recipient                                                  |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Persistent media uploads and deletions                                        |

Google Analytics is optional: enter a `G-…` measurement ID in Website content settings (`analyticsId`). Visitors must accept optional analytics before loading it. No analytics are active by default. Verify analytics, cookie handling and policy text against company requirements before activation.

## Deployment steps

1. Provision the database and configure secrets. Back up any existing database before migrations.
2. Install with `npm ci --ignore-scripts`, then `npm run db:generate`. This explicit generation works around Windows npm lifecycle issues. In the supplied Docker build, normal `npm ci` runs on Linux.
3. Run `npm run db:migrate` to apply versioned migrations. Run `npm run db:seed` once for company content; reruns preserve edits.
4. Run `npm run typecheck`, `npm run lint`, tests against a dedicated test database, and `npm run build`.
5. Run `npm run admin:create` interactively on the application host. Use a unique long password. Do not share an account among staff.
6. Start `node server/dist/index.js` under the host's service manager. Serve the site and `/api` from the same HTTPS origin.
7. Point domain DNS to the host/load balancer, provision a certificate with your host or ACME tooling, and proxy to Node port 4000. Restrict PostgreSQL to the private network. Set the exact trusted proxy hop count if your infrastructure requires it.
8. Verify `/api/health`, `/sitemap.xml`, `/robots.txt`, direct public detail URLs, staff login, real inquiry submission, email delivery and media uploads. Publish genuine inventory only after verification.

Docker: set root `.env` `POSTGRES_PASSWORD`, configure `server/.env`, run `docker compose build`, `docker compose up -d db`, then migrations/seeding using your Node environment or a one-off app container. Start with `docker compose up -d app`. The image runs as the non-root `node` user. Compose binds ports to loopback; put your HTTPS proxy in front. Container startup does not automatically apply migrations or create an administrator.

## Staff access and recovery

Roles are ADMIN and STAFF. Staff can manage editorial records, categories, media and customer requests. Only administrators manage company settings, staff accounts and audit history. Role changes revoke the affected user's sessions. A user cannot deactivate or demote their own account.

Staff can change passwords from the dashboard. Forgotten-password links require SMTP, expire after 30 minutes, are stored only as hashes and can be used once. If SMTP is unavailable, the API explicitly reports that reset mail is unconfigured. An existing administrator can create a replacement account and deactivate the old account after verifying the staff member's identity.

## Media

Cloudinary stores uploaded images and videos persistently. JPEG/PNG/WebP images are decoded, size-limited and converted to optimized WebP. SVG and arbitrary documents are rejected. MP4 uploads have a basic container-signature check and a 20 MB size limit. This is not a complete media malware/transcoding service; use a provider upload pipeline and content controls if exposing uploads to less trusted users.

Replace media by uploading a new file, selecting it in the relevant record or settings and saving. Then delete the old file from the library. Entry gallery references and settings references block deletion. Avoid embedding media URLs directly in rich-text bodies if you need reference-aware deletion; those inline references are not currently tracked relationally.

If Cloudinary is not configured, uploads fail explicitly with 503; no temporary disk upload is presented as persistent storage. No real Cloudinary upload/delete round-trip was possible without credentials.

## Inquiries and notifications

Requests are saved to PostgreSQL before attempting mail delivery. Mail status is SENT, FAILED or NOT_CONFIGURED. An unavailable email integration does not discard the request. The dashboard is the authoritative inbox. SMTP retries are manual operational follow-up; no background retry worker is included.

## Backups and restoration

Use provider-managed daily backups with retention aligned to company policy. Additionally, run `pg_dump --format=custom --file=km-backup.dump "$DATABASE_URL"` in a secure operator shell. Store dumps encrypted outside the app server, restrict access and never commit them.

Test restoration in a separate database: create an empty target, then use `pg_restore --no-owner --dbname="$RESTORE_DATABASE_URL" km-backup.dump`. Verify content, users and requests before switching application traffic. Do not restore over the live database without a planned maintenance window and a fresh backup. Back up Cloudinary assets and provider configuration separately.

## Monitoring and maintenance

`/api/health` verifies a real database query. Capture service stdout/stderr in your platform's logging system without request bodies, credentials or cookies. Monitor server errors, failed mail and storage integration status. Audit history records administrative mutations, not a substitute for infrastructure logs.

Delete expired session/reset rows periodically using an operational database maintenance job. Review staff access and customer data retention on a regular schedule. The single-process in-memory rate limiter should be replaced with a shared store if deploying multiple application instances.

## Search Console and publication checks

Verify domain ownership through your DNS provider and Google Search Console. Submit `${SITE_URL}/sitemap.xml`. Confirm canonical URLs and social images after setting the actual domain. Staff URLs carry noindex metadata and are excluded from the sitemap. Public server responses include content and metadata without requiring JavaScript.

Review legal policy wording with the company, confirm media reuse rights, verify the WhatsApp number and social profiles, and obtain genuine listing/project/testimonial content before public launch. These business checks are not automatically inferred from stock media or source filenames.
