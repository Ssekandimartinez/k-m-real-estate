# Render deployment

The root `render.yaml` provisions a containerized Node API and PostgreSQL database in
Oregon, matching the existing `km-real-estate-db` database. The active backend is
`km-real-estate-oregon` at `https://km-real-estate-oregon.onrender.com`.
The frontend is hosted at `https://k-and-m-realestate.netlify.app`.
Netlify proxies `/api/*` to Render before its SPA fallback and serves the media
from its existing static deployment. The backend-only image excludes the 5 GB
frontend media collection; originals are preserved. `server/Dockerfile.render`
builds the API and includes the approved metadata needed to seed PostgreSQL.
`VITE_STANDALONE=false` enables real API requests. Browser API requests and
session cookies remain on the Netlify origin. `APP_ORIGIN` and `SITE_URL` both
use the public Netlify URL, including for password reset links.
The Blueprint selects only Free web and database compute. Do not upgrade either
resource or enable paid features. Free web services sleep after 15 idle minutes;
the next request can take about one minute to wake them. The Free database has a
1 GB limit and expires after 30 days. It is not permanent business data storage.
No automatic upgrade is authorized. Arrange an export and a separate free database
provider before expiry if the application must continue running without payment.

## Deploy

1. Push `render.yaml` to the connected GitHub repository branch.
2. In Render, create a Blueprint from that repository and branch. Leave the root
   directory unchanged and select the root `render.yaml`.
3. Confirm that both resources show Free, then apply the Blueprint. Review usage
   and spend settings: bandwidth and build usage above included allowances can
   incur charges when a payment method is present. Do not enable paid overages.
4. Render builds the backend Docker image, installs dependencies, generates Prisma
   Client and compiles the server. Netlify builds the frontend separately.
   At each startup, it applies migrations and runs the idempotent approved-content
   seed before starting Express. The seed initializes the approved media library
   only when absent and preserves existing library edits. Startup stops if either step fails. This avoids
   paid pre-deploy commands. The seed preserves existing edited content.
5. Check `/api/health` on the service's actual HTTPS URL. This performs a database
   query. Open the homepage and `/admin` on Netlify, not on the backend hostname.
   The backend-only image has no React HTML build; its root HTML route returns
   503 by design. Use `/api/health` to check backend readiness.
6. Free services have no interactive Shell. To create an administrator, use an
   interactive local terminal with `DATABASE_URL` pointing to the production
   database and run `npm run admin:create`. Temporarily allow only your current
   public IP in the database's external access settings and use its External
   Database URL with provider-required TLS. Remove that external access afterward.
   Keep the URL in a process environment or ignored local environment file, never
   Git or chat. This command creates one account; do not run local migrations or
   seed against production as part of administrator setup.

The database URL is supplied through a private database reference. Public database
access is disabled. Render supplies `PORT`. Both the service and database must
remain in Oregon; internal database addresses do not work across regions.
Render regions cannot be changed on an existing resource. The Oregon service
replaces the failed Frankfurt service without deleting the database.
Development database records and uploads are not migrated by this setup.

## Existing content and staff accounts

The initial seed creates approved company, service, catalogue and media metadata;
it does not copy a development database. Existing published properties, projects,
articles, images, edited settings and staff password hashes require a separate
database transfer. Back up both databases first, preserve existing production
records and foreign-key relationships, verify the import in a transaction, and
restore database network restrictions afterward. Migration snapshots are encrypted
under the ignored `.local/render-cli/migration-backups` directory; their keys are
protected by the Windows account that created them. Do not commit these files.
Browser sessions and password reset tokens should not be copied between hosts.

Publish future content through `https://k-and-m-realestate.netlify.app/admin`.
Local database edits do not automatically synchronize with production. Existing
records with `specs.demo=true` retain their illustrative/concept labels; copying
them does not verify availability or establish completed company work.

## External services and domain

Add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` in the
web service's Environment settings for persistent media uploads. Add `SMTP_HOST`,
`SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` and `NOTIFY_EMAIL` for email
notifications and password resets. Keep these secrets out of the Blueprint.
Without those services, uploads and email remain unavailable; inquiries still
save to PostgreSQL. Free Render web services block SMTP ports 25, 465 and 587,
so the default SMTP configuration will not work. Email needs a supported provider
connection on an allowed port or a separate HTTPS email integration.

The Netlify configuration must be deployed along with this Blueprint. Verify
`https://k-and-m-realestate.netlify.app/api/health` returns JSON after deployment.
Do not set `VITE_STANDALONE=true` in Netlify environment overrides. A sleeping
free Render instance can take longer to wake than Netlify's 26-second proxy
timeout; the first request after inactivity may fail and need a retry.

When attaching a custom domain, replace both `APP_ORIGIN` and `SITE_URL` in the
Blueprint with that exact HTTPS origin (no trailing slash), apply the change,
and verify login, inquiry submission, metadata and password reset links.
Update both the Render origin values and Netlify proxy target when moving either
host. Keep browser API requests on the frontend origin with this configuration.

See [DEPLOYMENT.md](DEPLOYMENT.md) for backups and maintenance. A successful local
build does not establish that the live Render service, database, SMTP or Cloudinary
integration has been verified.

References: [Blueprint specification](https://render.com/docs/blueprint-spec),
[Prisma deployment](https://render.com/docs/deploy-prisma-orm).
