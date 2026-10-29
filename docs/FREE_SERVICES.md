# Free production services

The Netlify frontend uses the real API on the free Oregon Render service.
Published records and staff accounts are stored in Render PostgreSQL. Existing
images and videos remain on Netlify; new uploads use Cloudinary. No paid plan or
automatic upgrade is authorized.

## New image and video uploads

On 29 October 2026, the owner confirmed successful email activation and dashboard
access for Cloudinary environment `xxnutxux`. Its Free plan was verified through
the provider API. The protected credentials were connected privately to the
existing Oregon Render backend and the resulting deployment reached `live`.
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` must remain
server-side environment variables, never frontend variables or Git-tracked values.

Live image and MP4 tests through the Netlify admin API verified upload, database
metadata persistence, public delivery and deletion. All temporary uploads,
metadata and verification sessions were removed; database network rules were
restored. The app currently accepts JPEG, PNG, WebP and MP4 uploads up to 20 MB per
file. Existing static media remains on Netlify; the 4.9 GB collection was not
migrated. Account access was confirmed by the owner; billing and long-term account
administration were not changed.

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

| Variable        | Value                                               |
| --------------- | --------------------------------------------------- |
| `SMTP_HOST`     | `smtp-relay.brevo.com`                              |
| `SMTP_PORT`     | `2525`                                              |
| `SMTP_USER`     | The SMTP login shown by Brevo                       |
| `SMTP_PASSWORD` | The Brevo SMTP key                                  |
| `SMTP_FROM`     | The sender address verified in Brevo                |
| `NOTIFY_EMAIL`  | The company inbox that should receive notifications |

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
