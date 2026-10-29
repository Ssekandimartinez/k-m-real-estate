# API and database design

All endpoints use `/api`. Public customers do not register. Read operations are public only for published editorial content. Writes require the configured exact browser `Origin`. Staff mutations also require the session CSRF token in `X-CSRF-Token`.

## Public

| Method | Path                        | Purpose                                                       |
| ------ | --------------------------- | ------------------------------------------------------------- |
| GET    | `/health`                   | Live PostgreSQL health check                                  |
| GET    | `/settings`                 | Public company content                                        |
| GET    | `/categories?kind=property` | Categories by content kind                                    |
| GET    | `/content/:kind`            | Published entries with pagination and filters                 |
| GET    | `/content/:kind/:slug`      | Published detail and gallery                                  |
| POST   | `/requests`                 | Contact, property, viewing, quotation or consultation request |

Kinds: `property`, `service`, `product`, `project`, `post`, `team`, `testimonial`. Filters: `q`, `category` (slug), `featured=true`, `location`, `transaction=SALE|RENT`, `currency=USD|SSP`, `min`, `max`, `bedrooms`, `bathrooms`, `amenity`, `sort=newest|price-asc|price-desc`, `page`, `limit`. Prices remain in their listed currency; no conversions are invented. Specify a currency for meaningful price comparisons.

Requests require `kind`, `name`, `email`, `phone`, `message` and `consent:true`. Optional: `entryId`, `service`, `location`, `quantities`, `preferredDate` (ISO datetime) and blank honeypot `website`. Property and viewing requests require a currently published property. Submission returns the persisted reference and notification status.

## Authentication

Staff may sign in with their email address or an assigned unique username. The login request retains the `email` field for compatibility; it accepts either identifier. Password fields include a show/hide control in the staff interface.

Catalogue groups are returned by GET `/catalogue-groups`, derived from published product records. Filter products using `subgroup=Furniture%20Supply` (or another returned value). Staff can edit each product's supply group.

POST `/auth/login` with email/password; GET `/auth/me`; POST `/auth/logout`; POST `/auth/password` with current/password; POST `/auth/forgot` with email; POST `/auth/reset` with token/password. Login/me return the CSRF token. Password changes and reset invalidate sessions. Secure production cookies use the `__Host-` prefix, HttpOnly, Secure and SameSite=Strict.

## Staff

| Method         | Path                     | Purpose                                               |
| -------------- | ------------------------ | ----------------------------------------------------- |
| GET            | `/admin/stats`           | Actual database counts                                |
| GET            | `/admin/content/:kind`   | Draft, published and archived content                 |
| POST           | `/admin/content`         | Create validated entry                                |
| PUT / DELETE   | `/admin/content/:id`     | Update / delete entry                                 |
| GET / POST     | `/admin/categories`      | List / create categories                              |
| PUT / DELETE   | `/admin/categories/:id`  | Update / delete unused category                       |
| GET            | `/admin/requests`        | Customer inbox; q, kind, status, service, page, limit |
| PATCH          | `/admin/requests/:id`    | Status, internal notes and followUpAt                 |
| GET            | `/admin/requests/export` | CSV export, same filters; max 10,000 rows             |
| GET / POST     | `/admin/media`           | List / multipart upload (file, name, alt, folder)     |
| PATCH / DELETE | `/admin/media/:id`       | Metadata update / stored asset deletion               |

Website configuration is developer-managed; PUT `/admin/settings` returns 403 for all staff roles.

The legacy dashboard URL `/admin/settings` no longer mounts an editor, and the
staff navigation contains no Website content section. GET `/settings` continues
to serve the saved company content to visitors.

Administrator only: GET/POST `/admin/users`; PATCH `/admin/users/:id`; GET `/admin/audit`.

Errors use `{error, details?}` with HTTP status. Unknown API routes return 404. Validation errors return 400, authentication 401, authorization/CSRF/origin rejection 403, conflicts 409. Unconfigured persistent uploads and reset email return 503.

## Data model

Prisma models: User, Session, PasswordReset, Category, Entry, EntryImage, CustomerRequest, Media, Setting and AuditLog. PostgreSQL enums model roles, editorial publication states and request types/statuses. Role permissions are enforced in middleware rather than separate editable permission tables.

Editorial entities share Entry, with a `kind` discriminator, typed common property fields and a validated scalar `specs` object. Property specs, amenities and pricing are stored with the entry; galleries are related EntryImage records linked to Media when selected from the library. Service, supply, project, article, team and testimonial records reuse the editorial workflow. Categories have a kind and unique slug within that kind.

Contact messages, property inquiries, viewing requests, quotations and consultations share CustomerRequest with typed `kind`, optional related entry, status, notes, follow-up and mail status. This intentionally uses fewer shared models than the one-table-per-noun list in the master brief, while retaining the requested workflows and real relationships.

Unique constraints cover emails, token hashes, content kind/slug, category kind/slug and cloud storage identifiers. Query indexes cover publication, location/transaction/price, request type/status and gallery ordering. Sessions and password resets cascade with users; galleries cascade with content. Media deletion is restricted while gallery references exist. Entry creation/update and nested gallery writes are atomic; publishing transitions and reset token consumption use database operations/transactions.
