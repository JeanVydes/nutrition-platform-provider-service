# location_service

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

# Delegated security microservice (token introspection)
SECURITY_SERVICE_URL=http://localhost:4000
SECURITY_INTROSPECTION_PATH=/auth/introspect

# Offline mock mode (bypass security microservice)
OFFLINE=false
OFFLINE_ACCOUNT_ID=mock-account-id
OFFLINE_ROLES=developer
OFFLINE_SCOPES=*
```

## security model

- This service does not handle login or password flows.
- It expects `Authorization: Bearer <token>` on protected endpoints.
- Each request token is validated against the external security service (`SECURITY_SERVICE_URL + SECURITY_INTROSPECTION_PATH`).
- `GET /health` is public (no auth, no rate limit).
- If the token is missing/invalid/rejected, the API responds with `401 Unauthorized`.

### offline mode (mock)

- Set `OFFLINE=true` to run this service without the security microservice.
- In this mode, auth introspection is bypassed and a mock auth context is injected on each protected request.
- Optional mock identity config:
  - `OFFLINE_ACCOUNT_ID`
  - `OFFLINE_ROLES` (comma-separated)
  - `OFFLINE_SCOPES` (comma-separated)
- Use this only for local development/testing. Keep `OFFLINE=false` in production.

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

## authors

- Jean Vydes - [GitHub](github.com/jeanvydes) - [Mail](mailto:jcvides@unimagdalena.edu.co)