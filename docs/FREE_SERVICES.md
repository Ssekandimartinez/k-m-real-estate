# Free production services

The Netlify frontend uses the real API on the free Oregon Render service.
Published records and staff accounts are stored in Render PostgreSQL. Existing
images and videos remain on Netlify; new uploads use Cloudinary. No paid plan or
automatic upgrade is authorized.

## New image and video uploads

The provisional Cloudinary environment `xxnutxux` was used to verify an actual
upload, database metadata persistence, image delivery and deletion through the
live admin API. Permanent ownership could not be confirmed, so its production
secret is disabled. Existing images remain safe on Netlify. Connect an owned
Free account using `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and
`CLOUDINARY_API_SECRET` privately in Render. They must not be frontend variables
or Git-tracked files.

The owner can finish claiming the prepared environment, or create a permanent
Free account with Google using `ssekandimartinez@gmail.com` and use that account's
credentials instead. The private claim link is kept outside Git. Unclaimed
environments expire, so successful upload tests alone do not establish permanent
ownership. Do not migrate the existing media collection into a temporary account.

Cloudinary's [Free plan](https://cloudinary.com/pricing) has usage limits. Keep
the account on Free, monitor usage, and avoid paid add-ons.

## Notifications and password reset emails

Email delivery is not configured yet. Customer inquiries and quotations still
save in PostgreSQL and appear in the staff inbox; their notification status is
`NOT_CONFIGURED` until a working mail provider is configured.

Use a [Brevo Free account](https://app.brevo.com/account/register), verify the
account and its sender address, then obtain the SMTP login and SMTP key from
Settings > SMTP & API. The SMTP key is different from the account password or
REST API key. Add these values privately to the Render service:

| Variable | Value |
| --- | --- |
| `SMTP_HOST` | `smtp-relay.brevo.com` |
| `SMTP_PORT` | `2525` |
| `SMTP_USER` | The SMTP login shown by Brevo |
| `SMTP_PASSWORD` | The Brevo SMTP key |
| `SMTP_FROM` | The sender address verified in Brevo |
| `NOTIFY_EMAIL` | The company inbox that should receive notifications |

Free Render blocks the usual SMTP ports 25, 465 and 587. Brevo supports port
2525, which works with the existing Nodemailer integration. Complete the values
together, redeploy, and verify sending before relying on password reset email.
Do not put provider secrets into chat, browser code or the repository.

Brevo's [Free-plan limits](https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan)
include a daily sending cap; do not upgrade or enable paid options automatically.
SMTP connection settings: [Brevo documentation](https://developers.brevo.com/docs/smtp-integration).

## Database retention

The current free Render database expires on 28 November 2026. Keep encrypted
exports and arrange a continuing database before that date; do not assume the
free Render database is permanent. See [RENDER.md](RENDER.md) for operations.
