# DevOps practice project

You are building a **Task Manager REST API**. The application is deliberately simple — it exists purely as the vehicle for demonstrating infrastructure skills. The application is not the portfolio piece. The infrastructure around it is.

**Note on this repository:** The runnable API today is a minimal **sessions** resource (full CRUD + health) backed by PostgreSQL via Prisma (`exercise`, `sets`, `reps`, `weight_kg`, `notes`, `logged_at`). It is the stand-in “small app” you deploy and observe; you can rename or reshape the domain later without changing the core DevOps story.

## By Day 13

| Deliverable | Status |
|-------------|--------|
| Node.js REST API with full CRUD operations | In progress (see `src/index.js`) |
| PostgreSQL database | In progress (Prisma + `DATABASE_URL`) |
| Dockerized from day one with Docker Compose | Planned |
| CI/CD pipeline via GitHub Actions | Planned |
| Infrastructure provisioned with Terraform on GCP | Planned |
| Secrets managed via GCP Secret Manager | Planned |
| Monitoring and alerting via Cloud Monitoring | Planned |
| Architecture diagram and full written documentation | Planned |

Update the table as you complete each item.

## Stack (application)

- **Runtime:** Node.js (ES modules)
- **HTTP:** Express 5
- **ORM:** Prisma 6
- **Database:** PostgreSQL

## API (current)

| Method | Path | Description |
|--------|------|----------------|
| `GET` | `/health` | Liveness-style check |
| `GET` | `/sessions` | List sessions |
| `GET` | `/sessions/:id` | Get one session |
| `POST` | `/sessions` | Create session |
| `PUT` | `/sessions/:id` | Replace session |
| `PATCH` | `/sessions/:id` | Partial update |
| `DELETE` | `/sessions/:id` | Delete session |

There is no authentication by design.

## Local development

1. **PostgreSQL** — Have a database reachable from your machine.

2. **Environment** — Copy the example env file and set your connection string:

   ```bash
   cp .env.example .env
   ```

   Edit `.env`: set `DATABASE_URL` (and optionally `PORT`).

3. **Install and Prisma client**

   ```bash
   npm install
   npm run db:generate
   ```

4. **Schema to database** (dev-friendly sync; for production-style flows prefer migrations later)

   ```bash
   npm run db:push
   ```

5. **Run**

   ```bash
   npm run dev
   ```

   Default URL: `http://localhost:3000` (or your `PORT`).

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server with `--watch` |
| `npm start` | Production-style `node` |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:push` | Push schema to DB (no migration files) |

## Security note

Do not commit `.env`. It is listed in `.gitignore`. For GCP practice, plan to move secrets to **Secret Manager** and inject them at runtime (containers, Cloud Run, GKE, etc.) rather than baking them into images.

## License

Private / educational use unless you add an explicit license.
