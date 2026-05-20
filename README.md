# Workout Sessions API

Minimal **Node.js** + **Express** REST API for workout sessions, backed by **PostgreSQL** via **Prisma**. Intended for local development and DevOps practice (containers, CI, deploys). No authentication.

## Prerequisites

- **Node.js** 18.18 or newer (required by Prisma 6)
- **PostgreSQL** reachable from your machine

## Quick start

1. Clone the repository and install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template and set your database URL:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and replace `DATABASE_URL` with a real connection string. Optionally set `PORT` (default is `8000`).

3. Create or update tables from the Prisma schema:

   ```bash
   npm run db:push
   ```

4. Regenerate the client after schema changes (usually automatic after `npm install`; run manually if needed):

   ```bash
   npm run db:generate
   ```

5. Start the server:

   ```bash
   npm run dev
   ```

   Or without file watching:

   ```bash
   npm start
   ```

6. Check that the process is healthy:

   ```bash
   curl http://localhost:3000/health
   ```

## Schema management

Use **`npm run db:push`** when you want the database schema to match `prisma/schema.prisma` immediately—typical for solo local development and throwaway databases. Use **[Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)** when you need versioned, repeatable schema changes (teams, staging/production, rollbacks, and reviewable migration history).

## npm scripts

| Script | Description |
|--------|-------------|
| `npm start` | Run the API (`node src/index.js`) |
| `npm run dev` | Run with `--watch` (reload on file changes) |
| `npm run db:generate` | Generate Prisma Client from `prisma/schema.prisma` |
| `npm run db:push` | Push schema to the database (good for dev; use migrations for stricter workflows) |

## API

Base URL: `http://localhost:PORT` (default port `8000`).

All JSON bodies use `Content-Type: application/json`.

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Returns `{ "status": "ok" }`. Suitable for load balancer or Kubernetes probes. |

### Sessions

| Method | Path | Description |
|--------|------|-------------|
| GET | `/sessions` | List all sessions, newest `logged_at` first. |
| GET | `/sessions/:id` | Get one session by UUID. **404** if not found. |
| POST | `/sessions` | Create a session. **201** with the created row. |
| PUT | `/sessions/:id` | Replace a session (same required fields as POST). If `logged_at` is omitted, the existing value is kept. **404** if not found. |
| PATCH | `/sessions/:id` | Partial update; send only fields to change. **400** if nothing to update. **404** if not found. |
| DELETE | `/sessions/:id` | Delete a session. **204** on success. **404** if not found. |

### Session fields

| Field | Type | Notes |
|-------|------|--------|
| `id` | string (UUID) | Set by the server on create. |
| `exercise` | string | Required on create and on full replace (PUT). |
| `sets` | integer | Required on create and PUT. |
| `reps` | integer | Required on create and PUT. |
| `weight_kg` | number | Required on create and PUT. |
| `notes` | string or `null` | Optional. |
| `logged_at` | ISO 8601 datetime | Optional on create; defaults to `now()`. Optional on PUT (omitted keeps current). |

### Example: create a session

```bash
curl -s -X POST http://localhost:3000/sessions \
  -H "Content-Type: application/json" \
  -d "{\"exercise\":\"Squat\",\"sets\":3,\"reps\":5,\"weight_kg\":100,\"notes\":\"felt heavy\"}"
```

## Deployment

> This app is containerized with Docker and deployed to GCP via GitHub Actions. See `/terraform` for infrastructure configuration and `/.github/workflows` for the CI/CD pipeline. Infrastructure is provisioned using Terraform. Secrets are managed via GCP Secret Manager.

## Application layout

- `src/index.js` — Express app and routes
- `prisma/schema.prisma` — Data model and `DATABASE_URL` datasource
- `.env.example` — Template for environment variables (do not commit real secrets)

Infrastructure and automation files below are **coming soon** and will be **added progressively** as the project grows:

- `Dockerfile` — *(coming soon)*
- `docker-compose.yml` — *(coming soon)*
- `.github/workflows/ci.yml` — *(coming soon)*
- `terraform/` — *(coming soon)*

## Security note

The API intentionally implements **no application-layer authentication**. Access control is expected to be enforced **outside** the process—via **GCP firewall rules**, an **nginx reverse proxy**, and other **network-level controls**—rather than inside Express. Do **not** expose this service to the public internet without those infrastructure controls (and TLS) in place; doing so would leave sessions data and the host undefended at the edge.
