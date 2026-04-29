# provider-service

check out the postman workspace for testing the location service:

[postman workspace ->](https://www.postman.com/attaminaka/workspace/software-enginnering-class-2026-sandbox)

## postgres docker command

```bash
docker run --name postgres-test \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=123456 \
  -e POSTGRES_DB=ubicaciones \
  -p 5432:5432 \
  -d postgres 
```

## .env example

```bash
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=123456
DB_NAME=ubicaciones

DB_MAX_CONNECTIONS=10
DB_IDLE_TIMEOUT=30000
DB_CONNECTION_TIMEOUT=2000

PRODUCTION=false
PORT=8080

# CORS (comma-separated in production)
# Example: CORS_ORIGINS=https://app.example.com,https://admin.example.com
CORS_ORIGINS=

# Rate limiting
RATE_LIMIT_MAX=120
RATE_LIMIT_TIME_WINDOW=1 minute

# Delegated security microservice (Pay School Snacks / ISUnimagdalena)
SECURITY_SERVICE_URL=https://mriai.coreunimag.com/api/auth
SECURITY_ME_PATH=/me

# Worker account validation against security service
SECURITY_ACCOUNT_CHECK_PATH_TEMPLATE=/users/:id
SECURITY_ACCOUNT_CHECK_METHOD=GET
SECURITY_SERVICE_TOKEN=

```

## security model

- This service does not handle login, signup, passwords, or OTP flows.
- The security microservice handles PIN/OTP login and user registration.
- This service only receives the `Bearer` JWT token issued by security.
- It expects `Authorization: Bearer <token>` on protected endpoints.
- Each request token is validated against the external security service (`SECURITY_SERVICE_URL + SECURITY_ME_PATH`).
- On `POST /workers`, the service validates that `accountId` exists in the security service using `SECURITY_ACCOUNT_CHECK_PATH_TEMPLATE` and the caller token.
- `GET /health` is public (no auth, no rate limit).
- If the token is missing/invalid/rejected, the API responds with `401 Unauthorized`.

## CORS and rate limiting

- In production, only origins listed in `CORS_ORIGINS` are allowed.
- In development, if `CORS_ORIGINS` is empty, all origins are allowed for easier local integration.
- Global rate limiting is enabled through `RATE_LIMIT_MAX` and `RATE_LIMIT_TIME_WINDOW`.
- Rate-limit headers are returned (`x-ratelimit-*`, `retry-after`).

## entities in english and DB mapping in spanish

- Domain entities use english field names:
  - [src/core/domain/entities/provider.entity.ts](src/core/domain/entities/provider.entity.ts)
  - [src/core/domain/entities/worker.entity.ts](src/core/domain/entities/worker.entity.ts)
  - [src/core/domain/entities/cafeteria.entity.ts](src/core/domain/entities/cafeteria.entity.ts)
- Drizzle maps those fields to spanish table/column names in:
  - [src/shared/database/schema.ts](src/shared/database/schema.ts)
- Example mapping:
  - `provider.accountId` -> `proveedores.id_account`
  - `worker.providerId` -> `trabajadores.id_proveedor`
  - `worker.employmentStatus` -> `trabajadores.estado_empleo_trabajador`
  - `cafeteria.schoolId` -> `cafeterias.id_colegio`

## production behavior

- `NODE_ENV=production` enables stricter behavior:
  - DB SSL is enabled in [src/shared/config/database.config.ts](src/shared/config/database.config.ts)
  - CORS allowlist is enforced (only `CORS_ORIGINS`)
  - Bearer token auth remains mandatory for protected endpoints
  - Global rate limiting remains active
- Keep in mind for deploy:
  - Set real `CORS_ORIGINS` (never leave empty in production)
  - Set reachable `SECURITY_SERVICE_URL` and correct `SECURITY_INTROSPECTION_PATH`
  - Ensure DB credentials and network access are correct
  - Add health checks against `/health`

## docker image and deployment

- Docker image definition: [Dockerfile](Dockerfile)
- Build image:

```bash
docker build -t location-service:latest .
```

- Run container:

```bash
docker run --name location-service \
  --env-file .env \
  -p 8080:8080 \
  location-service:latest
```

- Minimal production recommendation:
  - Use a production `.env` (or secret manager)
  - Run behind reverse proxy/API gateway
  - Centralize logs and monitor 401/429 rates

## api endpoints (for frontend)

All protected endpoints require `Authorization: Bearer <token>` from the security service.

### providers

- `POST /providers`
- `GET /providers`
- `GET /providers/account/:accountId`
- `PATCH /providers/:id`
- `DELETE /providers/:id`

### cafeterias

- `POST /cafeterias`
- `GET /cafeterias`
- `GET /cafeterias/:id`
- `GET /cafeterias/provider/:providerId`
- `PATCH /cafeterias/:id`
- `DELETE /cafeterias/:id`

### workers

- `POST /workers`
- `GET /workers`
- `GET /workers/:id`
- `GET /workers/provider/:providerId`
- `PATCH /workers/:id`
- `DELETE /workers/:id`

### assignments

- `POST /workers/assignments`
- `GET /workers/assignments`
- `GET /workers/assignments/worker/:workerId`
- `GET /workers/assignments/cafeteria/:cafeteriaId`
- `DELETE /workers/assignments/:id`

### school configs

- `GET /school-configs/school-ids` (returns only `idColegio[]`)

## postman scenarios included

- Collection file: [postman/provider-service.postman_collection.json](postman/provider-service.postman_collection.json)
- Environment file: [postman/provider-service.local.postman_environment.json](postman/provider-service.local.postman_environment.json)
- Coverage includes:
  - Happy path create/list/detail/filter requests.
  - Security auth flow (request PIN + login) to fetch a real token.
  - Happy path update requests for provider, cafeteria, and worker.
  - Happy path delete requests for provider, cafeteria, worker, and assignment.
  - Validation scenarios (`400`) with invalid UUIDs.
  - Validation scenarios (`400`) for malformed update/delete params.
  - Not found scenarios (`404`) with `MISSING_UUID`.
  - Auto-save IDs (`PROVIDER_ID`, `CAFETERIA_ID`, `WORKER_ID`, `ASSIGNMENT_ID`) for chained requests.
  - Pre-request auto-fix for missing/invalid UUID environment variables.

## frontend integration flow (recommended)

1. Create provider (`POST /providers`) and store `provider.id`.
2. Create cafeteria (`POST /cafeterias`) with `providerId`.
3. Create worker (`POST /workers`) with `providerId`.
4. Assign worker (`POST /workers/assignments`) with `workerId` and `cafeteriaId`.
5. Edit existing records when needed with:
  - `PATCH /providers/:id`
  - `PATCH /cafeterias/:id`
  - `PATCH /workers/:id`
6. Delete records when needed with:
  - `DELETE /workers/assignments/:id` (recommended first)
  - `DELETE /workers/:id`
  - `DELETE /cafeterias/:id`
  - `DELETE /providers/:id`
7. Build listing screens with:
   - `GET /providers`, `GET /cafeterias`, `GET /workers`, `GET /workers/assignments`.
8. Build detail/filter views with:
   - `GET /providers/account/:accountId`
   - `GET /cafeterias/:id`, `GET /cafeterias/provider/:providerId`
  - `GET /workers/:id`, `GET /workers/provider/:providerId`
   - `GET /workers/assignments/worker/:workerId`, `GET /workers/assignments/cafeteria/:cafeteriaId`

## authors

- Jean Vydes - [GitHub](github.com/jeanvydes) - [Mail](mailto:jcvides@unimagdalena.edu.co)