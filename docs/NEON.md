# Neon database operations

The production API remains on Render's Free plan. Its `DATABASE_URL` is managed
as a secret in the Render service environment and points to Neon PostgreSQL.
`render.yaml` uses `sync: false` so Blueprint syncs cannot replace this secret
with the expiring Render database URL. Existing services require the secret to
be changed through the Dashboard or API; changing the Blueprint alone does not
change their connection. Keep `APP_ORIGIN`, `SITE_URL`, Cloudinary and email
configuration unchanged during a database transfer.

Use the Neon Free plan and monitor its storage and compute allowances. The
database can scale to zero while idle, and the free Render API still sleeps.
Photos and videos hosted by Netlify load independently of both services.

## Migration and recovery

Before switching connections, preserve encrypted source and target snapshots,
compare the repository's migration checksums with production, apply the same
schema to an empty target, then briefly suspend the API while taking the final
source snapshot. Copy business records in one transaction, preserving IDs,
relationships, staff password hashes, media URLs, settings and customer requests.
Compare every copied row before committing. Do not copy browser sessions or
password reset tokens; staff must sign in again after migration.

Local migration credentials and encrypted snapshots are under the Git-ignored
`.local/neon` directory. Backup keys are protected by the Windows account that
created them. Preserve that account and the key files for recovery. Never commit
credentials, customer records, password hashes or plaintext database exports.

After updating only `DATABASE_URL`, deploy/resume the API and verify the database
health endpoint, published content, staff authentication and request persistence.
Check that unrelated environment variables and original database network rules
remain unchanged. Record completed checks separately from checks still pending.

The original `km-real-estate-db` is retained for recovery and expires on
28 November 2026. After the new database starts accepting writes, restoring the
old connection alone would lose access to those new records. Reconcile any new
data before a rollback. Do not delete the original database as part of migration.

References: [Neon plans](https://neon.com/docs/introduction/plans),
[Render migration guide](https://neon.com/docs/import/migrate-from-render),
[Render environment variables](https://render.com/docs/configure-environment-variables).
