# K&M Real Estate

Corporate website and staff workspace for K&M Real Estate, Juba, South Sudan. React/Vite/TypeScript client, Express REST API, PostgreSQL/Prisma persistence. Uses the supplied Burgundy & Sandstone identity and original asset library.

Repository: https://github.com/Ssekandimartinez/k-m-real-estate

## Start locally

Use Node.js 22.12+ (Node 22 LTS recommended) and npm. On Windows PowerShell, use `npm.cmd` if execution policy blocks `npm.ps1`. Root task scripts call Node directly to accommodate the ampersand in this directory name.

```sh
npm ci --ignore-scripts
npm run db:generate
```

Provide PostgreSQL using your own instance or Docker Compose. Copy `.env.example` to `.env`, set a unique database password, then run `docker compose up -d db`. Copy `server/.env.example` to `server/.env` and set its `DATABASE_URL` to the same database credentials.

For a Windows development environment without Docker, optional local PostgreSQL tooling is included:

```sh
node node_modules/@embedded-postgres/windows-x64/scripts/hydrate-symlinks.js
node scripts/local-database.mjs
```

This creates a localhost-only database on port 55432 with random credentials in ignored `.local/` files, and creates `server/.env` only if absent. Keep the process running while using the application. It does not provision production services.

```sh
npm run db:migrate
npm run db:seed
npm run admin:create
npm run dev
```

Development frontend: http://localhost:5173. API: http://localhost:4000. Staff access: `/admin`. The first administrator command prompts for credentials; passwords are hidden and no default account is shipped. Staff can be created afterward in Staff accounts.

The seed is idempotent and preserves edited records. It loads company information and the complete approved service and supply catalogue. No active properties, company projects, team profiles, articles or testimonials are fabricated.

## Commands

| Command                         | Purpose                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------- |
| `npm run dev`                   | API and Vite dev servers                                                                    |
| `npm run typecheck`             | Both TypeScript projects                                                                    |
| `npm run lint`                  | ESLint                                                                                      |
| `npm test`                      | Validation and frontend workflow tests; database tests opt in                               |
| `RUN_DATABASE_TESTS=1 npm test` | Include real PostgreSQL API tests (PowerShell: `$env:RUN_DATABASE_TESTS='1'; npm.cmd test`) |
| `npm run test:e2e`              | Chrome desktop/mobile workflows; requires built server on port 4000 and database            |
| `npm run build`                 | Client and server production builds                                                         |
| `node server/dist/index.js`     | Serve built website, server content/metadata and API                                        |
| `npm run assets:prepare`        | Rebuild selected image derivatives from preserved originals                                 |

For browser tests or a built local preview, set `APP_ORIGIN=http://localhost:4000`. Vite development uses `http://localhost:5173`. The browser origin must match exactly for writes; cross-origin requests are rejected.

Production setup, external configuration, backup/restore and security operations: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). API and data design: [docs/API.md](docs/API.md). Delivery status and test evidence: [docs/HANDOVER.md](docs/HANDOVER.md).
