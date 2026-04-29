# Pay School Snacks Providers Service

| Campo | Valor |
|---|---|
| **Nombre** | Pay School Snacks Providers Service |
| **Descripción** | Microservicio responsable de la gestión de proveedores, cafeterías y fuerza laboral. |
| **Versión** | 1.0.0 |
| **Entorno** | Node.js (API REST) |
| **Bounded Context** | Gestión de Proveedores, Ubicaciones y Fuerza Laboral |
| **Integrantes** | Jean Vides, Luis Rincon, Santiago Criollo |
| **Repositorio** | https://github.com/JeanVydes/nutrition-platform-provider-service |

---

## 1. Propósito y Alcance

La plataforma **Pay School Snacks** es un ecosistema amplio. Este servicio, **Pay School Snacks Providers Service**, abarca únicamente una pequeña parte de ese ecosistema: somos la fuente de verdad para la gestión de los proveedores. Determinamos quién opera una cafetería, en qué colegio está ubicada, qué trabajadores pertenecen a qué proveedor y cómo están asignados a cada ubicación.

**Preguntas que este servicio responde:**
- ¿Qué cafeterías opera un proveedor determinado?
- ¿Qué trabajadores están asignados a una cafetería?
- ¿Cuál es el cargo, tipo de contrato y salario de un trabajador?
- ¿A qué base de datos del colegio apunta una cafetería?
- ¿Existe una cuenta de usuario válida en el servicio de seguridad para un trabajador?

**Fuera del alcance:** menús, inventario, ventas, pagos y transacciones. Esos dominios corresponden a microservicios independientes.

---

## 2. Stack Tecnológico

| Componente | Tecnología | Justificación Técnica |
|---|---|---|
| Lenguaje | TypeScript 5 | Tipado estricto. Previene en tiempo de compilación que un campo como `salario_trabajador` sea tratado como `string` en lugar de `number`. |
| Runtime | Node.js ≥ 22 / Bun | Arquitectura no bloqueante (event loop). Maneja miles de peticiones concurrentes sin bloquear el hilo principal. Bun acelera la compilación y ejecución del código. |
| Framework HTTP | Fastify 5.7 + fastify-type-provider-zod | Menor overhead por petición frente a Express. Garantiza latencias bajas al consultar asignaciones o crear trabajadores desde múltiples cafeterías simultáneamente. |
| Validación | Zod 4 | Escudo de entrada. Antes de que cualquier dato toque la lógica de negocio, Zod verifica que el JSON recibido cumpla exactamente el esquema acordado. UUID malformados, campos faltantes y tipos incorrectos son rechazados en la capa HTTP. |
| Base de Datos | PostgreSQL 16 con pgcrypto | Integridad referencial garantizada a nivel de motor. |
| ORM | Drizzle ORM 0.45 | Genera SQL predecible y ligero. A diferencia de ORMs que instancian grafos de objetos en memoria, Drizzle mantiene el consumo de RAM del microservicio estable independientemente del volumen de registros. |
| Logger | Pino / Pino-pretty | Pino emite logs estructurados en JSON con mínimo impacto en CPU. Son consumibles directamente por agentes de observabilidad externos o transformables a formato legible. |
| Rate Limiting | @fastify/rate-limit | Previene saturación artificial del servicio por peticiones abusivas o errores en clientes. Configurable vía variables de entorno. |
| CORS | @fastify/cors | Restringe los orígenes HTTP permitidos, especificando los dominios explícitos autorizados. |
| Errores HTTP | @fastify/sensible | Estandariza la estructura JSON de todas las respuestas de error con códigos HTTP semánticos. |
| Seguridad | Delegada a microservicio externo | Autenticación real mediante JWT. Cada petición protegida delega la validación del token al servicio de seguridad vía introspección. |

---

## 3. Seguridad

El servicio implementa autenticación real delegada a un microservicio de seguridad.

### 3.1 Autenticación — Introspección de Token JWT

Toda petición HTTP (excepto `GET /health` y `OPTIONS`) pasa por un hook `onRequest` que:

1. Extrae el header `Authorization: Bearer <ACCESS_TOKEN>`.
2. Si el header no existe o no tiene formato Bearer → **401 Unauthorized**.
3. Realiza una petición `GET` al servicio de seguridad (`SECURITY_SERVICE_URL` + `SECURITY_ME_PATH`) para verificar que el token es válido y activo.
4. Decodifica el payload del JWT para extraer `sub` (o `uuidAcceso`), `roles` y `scopes`.
5. Si la introspección falla o el servicio de seguridad rechaza el token → **401 Unauthorized**.
6. El contexto autenticado (`accountId`, `roles`, `scopes`, `accessToken`) se inyecta en el request para uso posterior.

**Timeout de introspección:** 3 segundos (AbortController).

```
Servicio de Seguridad: https://mriai.coreunimag.com/api/auth
```

### 3.2 Validación de Cuentas de Trabajadores

Al registrar o actualizar un trabajador, el Use Case `RegisterWorkerUseCase` / `UpdateWorkerUseCase` invoca `IAccountValidationService.ensureAccountExists(accountId, accessToken)` para verificar que el `accountId` del trabajador corresponde a un usuario real registrado en el servicio de seguridad.

La implementación `SecurityAccountValidationService`:
1. Construye la URL usando `SECURITY_ACCOUNT_CHECK_PATH_TEMPLATE` (ej: `/users/:id`).
2. Envía una petición HTTP al servicio de seguridad con el token del actor.
3. Si la cuenta no existe (404) → lanza error `"Account not found in security service"`.
4. Si el servicio de seguridad responde con error → lanza error `"Could not validate account with security service"`.
5. Timeout: 3 segundos.

### 3.3 Contexto de Autenticación

```typescript
type AuthContext = {
    accountId: string;   // UUID del usuario autenticado
    roles: string[];     // Roles del usuario (extraído del JWT)
    scopes: string[];    // Scopes/permisos (extraído del JWT)
    accessToken: string; // Token original para propagación service-to-service
};
```

---

## 4. Arquitectura: Clean Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  INFRAESTRUCTURA                                                    │
│  Fastify routes, Drizzle repositories, SecurityAccountValidation    │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  APLICACIÓN (Casos de Uso)                                    │  │
│  │  register-provider.use-case.ts                                │  │
│  │  assign-worker-cafeteria.use-case.ts                          │  │
│  │  register-worker.use-case.ts (valida cuenta en security svc)  │  │
│  │                                                               │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │  DOMINIO                                                │  │  │
│  │  │  Entidades: Provider, Cafeteria, Worker,                │  │  │
│  │  │             WorkerAssignment, SchoolConfig              │  │  │
│  │  │  Interfaces: IProviderRepository, IWorkerRepository,    │  │  │
│  │  │             ICafeteriaRepository, IAccountValidation... │  │  │
│  │  │  Sin dependencia de Fastify, Drizzle ni frameworks.     │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.1 Flujo de una Petición HTTP

```
Cliente HTTP
    │
    ▼
[1] Hook onRequest — Autenticación JWT
│   Introspección contra servicio de seguridad externo
│   Rechaza con 401 si token inválido o ausente
    ▼
[2] Router Fastify
│   Dirige la petición al módulo correcto
    ▼
[3] Validación Zod (en Controller)
│   Rechaza con 400 si UUID es inválido o el body no cumple el esquema
    ▼
[4] Controlador
│   Extrae datos validados, instancia el Use Case con sus dependencias
▼
[5] Caso de Uso
│   Aplica reglas de negocio
│   (ej: verifica que el providerId exista, valida accountId contra
│    servicio de seguridad antes de crear trabajador)
▼
[6] Repositorio (Interfaz del Dominio)
│   Abstracción: el Use Case no sabe qué base de datos se usa
▼
[7] Implementación Drizzle ORM
│   Ejecuta el SQL contra PostgreSQL
▼
[8] Respuesta JSON → cliente
```

### 4.2 Estructura de Directorios

```
provider-service/
├── Dockerfile
├── docker-compose.yml
├── .env
├── postman/
│   ├── provider-service.postman_collection.json      ← 60+ test cases
│   └── provider-service.local.postman_environment.json
├── migrations/
│   ├── provider-service-schema.sql                   ← DDL + seed idempotente
│   ├── schema.sql
│   └── seed.sql
├── src/
│   ├── app.ts                                        ← Entry point
│   ├── server.ts                                     ← Fastify setup + auth hook
│   ├── core/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── provider.entity.ts
│   │   │   │   ├── cafeteria.entity.ts
│   │   │   │   ├── worker.entity.ts
│   │   │   │   ├── worker-assignment.entity.ts
│   │   │   │   └── school-config.entity.ts
│   │   │   ├── repositories/
│   │   │   │   ├── provider.repository.ts
│   │   │   │   ├── cafeteria.repository.ts
│   │   │   │   ├── worker.repository.ts
│   │   │   │   ├── worker-assignment.repository.ts
│   │   │   │   └── school-config.repository.ts
│   │   │   ├── services/
│   │   │   │   └── account-validation.service.ts     ← Interface
│   │   │   └── value-objects/
│   │   │       └── coordinates.value-objects.ts
│   │   └── application/
│   │       ├── use-cases/
│   │       │   ├── providers/     (5 use cases)
│   │       │   ├── cafeterias/    (6 use cases)
│   │       │   ├── workers/       (12 use cases)
│   │       │   ├── school-configs/(1 use case)
│   │       │   └── errors/
│   │       │       └── application.errors.ts
│   │       └── types/
│   │           └── pagination.ts
│   ├── modules/
│   │   ├── providers/infrastructure/
│   │   │   ├── drizzle/ (schema + repository)
│   │   │   └── http/    (controller + routes)
│   │   ├── cafeterias/infrastructure/
│   │   │   ├── drizzle/ (schema + repository)
│   │   │   └── http/    (controller + routes)
│   │   ├── workers/infrastructure/
│   │   │   ├── drizzle/ (2 schemas + 2 repositories)
│   │   │   └── http/    (controller + routes)
│   │   └── school-configs/infrastructure/
│   │       ├── drizzle/ (repository)
│   │       └── http/    (controller + routes)
│   └── shared/
│       ├── config/database.config.ts
│       ├── database/
│       ├── security/
│       │   └── security-account-validation.service.ts ← Implementación real
│       └── utils/
└── tsconfig.json / tsconfig.build.json
```

---

## 5. Modelo de Datos

### 5.1 Tablas y Columnas

#### `public.proveedores`

| Columna | Tipo | Notas |
|---|---|---|
| id_proveedor | uuid | PK, `gen_random_uuid()` vía pgcrypto |
| id_account | uuid | NOT NULL, FK externa al servicio de autenticación |
| nombre_proveedor | varchar(255) | NOT NULL |
| registro_empresa_proveedor | varchar(100) | NIT o equivalente |
| email_contacto_proveedor | varchar(255) | |
| telefono_contacto_proveedor | varchar(50) | |
| pais | varchar(100) | País de origen/operación |
| ciudad | varchar(100) | Ciudad de operación |
| direccion_facturacion | varchar(255) | Dirección principal para facturación |
| oficina | varchar(100) | Número de local u oficina |
| creado_en | timestamp | DEFAULT `now()` |

#### `public.cafeterias`

| Columna | Tipo | Notas |
|---|---|---|
| id_cafeteria | uuid | PK, `gen_random_uuid()` |
| id_colegio | uuid | NOT NULL, referencia al colegio (federado) |
| id_proveedor | uuid | NOT NULL, FK → proveedores ON DELETE CASCADE |
| nombre_cafeteria | varchar(255) | |
| creado_en | timestamp | DEFAULT `now()` |

#### `public.trabajadores`

| Columna | Tipo | Notas |
|---|---|---|
| id_trabajador | uuid | PK, `gen_random_uuid()` |
| id_account | uuid | NOT NULL, FK externa al servicio de autenticación (validada en tiempo real) |
| id_proveedor | uuid | NOT NULL, FK → proveedores ON DELETE CASCADE |
| estado_empleo_trabajador | enum | `activo` / `suspendido` / `retirado`, DEFAULT `activo` |
| cargo_trabajador | varchar(100) | Ej: "Cocinero", "Auxiliar" |
| tipo_contrato_trabajador | varchar(100) | Ej: "fijo", "temporal" |
| fecha_contratacion_trabajador | date | |
| salario_trabajador | numeric(10,2) | Salario base del trabajador |
| creado_en | timestamp | DEFAULT `now()` |

#### `public.asignaciones_trabajadores`

| Columna | Tipo | Notas |
|---|---|---|
| id_asignacion_trabajador | uuid | PK, `gen_random_uuid()` |
| id_trabajador | uuid | NOT NULL, FK → trabajadores ON DELETE CASCADE |
| id_cafeteria | uuid | NOT NULL, FK → cafeterias ON DELETE CASCADE |
| rol_trabajador | varchar(100) | Ej: "Turno mañana", "Encargado de turno" |
| fecha_inicio_asignacion | date | |
| fecha_fin_asignacion | date | NULL = asignación vigente |

#### `public.colegios_db_config`

| Columna | Tipo | Notas |
|---|---|---|
| id_colegio | uuid | PK, provisto externamente, no autogenerado |
| host_db | varchar(255) | NOT NULL, host de la base de datos del colegio |
| puerto_db | integer | NOT NULL, puerto PostgreSQL |
| nombre_db | varchar(255) | NOT NULL, nombre de la base de datos |
| usuario_db | varchar(255) | Usuario de conexión |
| creado_en | timestamp | DEFAULT `now()` |

> **Nota:** Esta tabla es de solo lectura para el `provider-service`. Permite al sistema localizar la base de datos federada de cada institución educativa sin exponer credenciales a través de la API.

### 5.2 Relaciones

```
proveedores (1) ────────────── (M) cafeterias
proveedores (1) ────────────── (M) trabajadores
trabajadores (1) ──────────── (M) asignaciones_trabajadores
cafeterias (1) ────────────── (M) asignaciones_trabajadores
colegios_db_config (1) ──────── referenciado por cafeterias.id_colegio
```

---

## 6. Contrato de la API

**Base URL producción:** `https://api-provider-prod.taminaka.com`

Todas las rutas requieren el header `Authorization: Bearer <ACCESS_TOKEN>`, excepto `GET /health`.
El token se obtiene del microservicio de seguridad delegado (flujo OTP: Request PIN → Login → ACCESS_TOKEN).

---

### GET /health

Verificación de disponibilidad del servicio. Responde **200 OK** sin autenticación. Sin rate limit.

**Respuesta:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-28T22:00:00.000Z",
  "service": "provider-service"
}
```

---

### Proveedores — `/providers`

#### POST /providers — Crear proveedor

**Status OK:** 201 Created

**Body:**
```json
{
  "accountId": "uuid (requerido)",
  "name": "Fresh Foods S.A.S (requerido, min 1 carácter)",
  "companyRegistration": "NIT-900123456 (opcional)",
  "contactEmail": "ops@freshfoods.co (opcional, debe ser email válido)",
  "contactPhone": "+573001234567 (opcional)"
}
```

**Respuesta 201:**
```json
{
  "id": "uuid",
  "accountId": "uuid",
  "name": "Fresh Foods S.A.S",
  "companyRegistration": "NIT-900123456",
  "contactEmail": "ops@freshfoods.co",
  "contactPhone": "+573001234567",
  "createdAt": "2026-04-28T22:00:00.000Z"
}
```

**Errores posibles:**
| HTTP | Causa |
|---|---|
| 400 | Body inválido según Zod (accountId no UUID, name vacío, email mal formado) |
| 401 | Token ausente o rechazado por el servicio de seguridad |
| 409 | `accountId` ya registrado como proveedor |

---

#### GET /providers — Listar todos los proveedores

**Status OK:** 200 → array

**Respuesta:**
```json
[
  {
    "id": "uuid",
    "accountId": "uuid",
    "name": "Fresh Foods S.A.S",
    "companyRegistration": "NIT-900123456",
    "contactEmail": "ops@freshfoods.co",
    "contactPhone": "+573001234567",
    "createdAt": "2026-04-28T22:00:00.000Z"
  }
]
```

---

#### GET /providers/account/:accountId — Buscar proveedor por accountId

**Status OK:** 200

**Validación de parámetro:** `accountId` debe ser UUID válido (Zod).

**Errores posibles:**
| HTTP | Causa |
|---|---|
| 400 | `accountId` no es un UUID válido |
| 401 | Token ausente o rechazado |
| 404 | No existe proveedor con ese accountId |

---

#### PATCH /providers/:id — Actualizar datos del proveedor

**Status OK:** 200

**Body (al menos un campo requerido):**
```json
{
  "name": "Fresh Foods S.A.S Edit (opcional, min 1 carácter)",
  "companyRegistration": "NIT-900123456 (opcional, nullable)",
  "contactEmail": "new@email.co (opcional, nullable, debe ser email válido)",
  "contactPhone": "+573001112233 (opcional, nullable)"
}
```

**Errores posibles:**
| HTTP | Causa |
|---|---|
| 400 | `:id` no es UUID válido, body vacío, o formato inválido |
| 401 | Token ausente o rechazado |
| 404 | Proveedor no encontrado |

---

#### DELETE /providers/:id — Eliminar proveedor

**Status OK:** 204 No Content

**Errores posibles:**
| HTTP | Causa |
|---|---|
| 400 | `:id` no es UUID válido |
| 401 | Token ausente o rechazado |
| 404 | Proveedor no encontrado |
| 400 | `id` no es UUID válido |

---

### Cafeterías — `/cafeterias`

#### POST /cafeterias — Crear cafetería

**Status OK:** 201 Created

**Body:**
```json
{
  "schoolId": "uuid (requerido)",
  "providerId": "uuid (requerido)",
  "name": "Cafetería Central Sede Norte (opcional)"
}
```

**Respuesta 201:**
```json
{
  "id": "uuid",
  "schoolId": "uuid",
  "providerId": "uuid",
  "name": "Cafetería Central Sede Norte",
  "createdAt": "2026-04-28T22:00:00.000Z"
}
```

**Errores posibles:**
| HTTP | Causa |
|---|---|
| 400 | Body inválido según Zod (schoolId o providerId no UUID) |
| 400/404 | `providerId` no existe en la tabla de proveedores |
| 401 | Token ausente o rechazado |

---

#### GET /cafeterias — Listar todas las cafeterías

**Status OK:** 200 → array

---

#### GET /cafeterias/:id — Detalle de cafetería por ID

**Status OK:** 200

**Errores posibles:**
| HTTP | Causa |
|---|---|
| 400 | `:id` no es UUID válido |
| 401 | Token ausente o rechazado |
| 404 | Cafetería no encontrada |

---

#### GET /cafeterias/provider/:providerId — Cafeterías de un proveedor

**Status OK:** 200 → array

**Errores posibles:**
| HTTP | Causa |
|---|---|
| 400 | `:providerId` no es UUID válido |
| 401 | Token ausente o rechazado |

---

#### PATCH /cafeterias/:id — Actualizar cafetería

**Status OK:** 200

**Body (al menos un campo requerido):**
```json
{
  "schoolId": "uuid (opcional)",
  "providerId": "uuid (opcional)",
  "name": "Cafetería Central Edit (opcional, nullable)"
}
```

**Errores posibles:**
| HTTP | Causa |
|---|---|
| 400 | `:id` no UUID, body vacío, o formato inválido |
| 401 | Token ausente o rechazado |
| 404 | Cafetería no encontrada |

---

#### DELETE /cafeterias/:id — Eliminar cafetería

**Status OK:** 204 No Content

**Errores posibles:**
| HTTP | Causa |
|---|---|
| 400 | `:id` no es UUID válido, o cafetería tiene asignaciones activas |
| 401 | Token ausente o rechazado |
| 404 | Cafetería no encontrada |

---

### Trabajadores — `/workers`

#### POST /workers — Registrar trabajador

**Status OK:** 201 Created

> **Nota:** Al crear un trabajador, el servicio valida que el `accountId` corresponda a una cuenta real en el servicio de seguridad antes de persistir el registro.

**Body:**
```json
{
  "accountId": "uuid (requerido — debe existir en el servicio de seguridad)",
  "providerId": "uuid (requerido — debe existir en proveedores)",
  "position": "Cocinero (opcional)",
  "contractType": "fijo (opcional)",
  "hireDate": "2026-01-10 (opcional, formato YYYY-MM-DD)",
  "salary": "1800000.00 (opcional, string numérico con hasta 2 decimales, máx 99999999.99)"
}
```

**Respuesta 201:**
```json
{
  "id": "uuid",
  "accountId": "uuid",
  "providerId": "uuid",
  "employmentStatus": "activo",
  "position": "Cocinero",
  "contractType": "fijo",
  "hireDate": "2026-01-10",
  "salary": "1800000.00",
  "createdAt": "2026-04-28T22:00:00.000Z"
}
```

**Errores posibles:**
| HTTP | Causa |
|---|---|
| 400 | Body inválido (UUID inválido, salary fuera de formato, hireDate mal formación) |
| 400 | `accountId` no encontrado en el servicio de seguridad |
| 400 | Servicio de seguridad inaccesible para validar la cuenta |
| 400/404 | `providerId` no existe en la tabla de proveedores |
| 401 | Token ausente o rechazado |

---

#### GET /workers — Listar todos los trabajadores

**Status OK:** 200 → array

---

#### GET /workers/:id — Detalle de trabajador por ID

**Status OK:** 200

**Errores posibles:**
| HTTP | Causa |
|---|---|
| 400 | `:id` no es UUID válido |
| 401 | Token ausente o rechazado |
| 404 | Trabajador no encontrado |

---

#### GET /workers/provider/:providerId — Trabajadores de un proveedor

**Status OK:** 200 → array

**Errores posibles:**
| HTTP | Causa |
|---|---|
| 400 | `:providerId` no es UUID válido |
| 401 | Token ausente o rechazado |

---

#### PATCH /workers/:id — Actualizar trabajador

**Status OK:** 200

> **Nota:** Si se actualiza el `accountId`, se valida contra el servicio de seguridad.

**Body (al menos un campo requerido):**
```json
{
  "accountId": "uuid (opcional — se valida contra seguridad si se incluye)",
  "providerId": "uuid (opcional — se valida existencia si se incluye)",
  "position": "Cocinero Senior (opcional, nullable)",
  "contractType": "fijo (opcional, nullable)",
  "hireDate": "2026-05-01 (opcional, nullable, formato YYYY-MM-DD)",
  "salary": "2200000.00 (opcional, nullable, string numérico máx 99999999.99)"
}
```

**Errores posibles:**
| HTTP | Causa |
|---|---|
| 400 | `:id` no UUID, body vacío, salary/hireDate formato inválido |
| 400 | `accountId` no encontrado en el servicio de seguridad |
| 401 | Token ausente o rechazado |
| 404 | Trabajador no encontrado |

---

#### DELETE /workers/:id — Eliminar trabajador

**Status OK:** 204 No Content

**Errores posibles:**
| HTTP | Causa |
|---|---|
| 400 | `:id` no es UUID válido, o trabajador tiene asignaciones activas |
| 401 | Token ausente o rechazado |
| 404 | Trabajador no encontrado |

---

### Asignaciones de Trabajadores — `/workers/assignments`

No existe endpoint PATCH. Una asignación se cierra eliminándola; si el rol cambia, se elimina la vigente y se crea una nueva.

#### POST /workers/assignments — Asignar trabajador a cafetería

**Status OK:** 201 Created

**Body:**
```json
{
  "workerId": "uuid (requerido — debe existir en trabajadores)",
  "cafeteriaId": "uuid (requerido — debe existir en cafeterías)",
  "role": "Encargado de turno (opcional)",
  "startDate": "2026-02-01 (opcional)",
  "endDate": "null (opcional, null = asignación vigente)"
}
```

**Respuesta 201:**
```json
{
  "id": "uuid",
  "workerId": "uuid",
  "cafeteriaId": "uuid",
  "role": "Encargado de turno",
  "startDate": "2026-02-01",
  "endDate": null
}
```

**Errores posibles:**
| HTTP | Causa |
|---|---|
| 400 | Body inválido (UUID inválido) |
| 400/404 | `workerId` o `cafeteriaId` no existen |
| 401 | Token ausente o rechazado |

---

#### GET /workers/assignments — Listar todas las asignaciones

**Status OK:** 200 → array

---

#### GET /workers/assignments/worker/:workerId — Asignaciones de un trabajador

**Status OK:** 200 → array

**Errores posibles:**
| HTTP | Causa |
|---|---|
| 400 | `:workerId` no es UUID válido |
| 401 | Token ausente o rechazado |

---

#### GET /workers/assignments/cafeteria/:cafeteriaId — Personal de una cafetería

**Status OK:** 200 → array

**Errores posibles:**
| HTTP | Causa |
|---|---|
| 400 | `:cafeteriaId` no es UUID válido |
| 401 | Token ausente o rechazado |

---

#### DELETE /workers/assignments/:id — Eliminar asignación

**Status OK:** 204 No Content

**Errores posibles:**
| HTTP | Causa |
|---|---|
| 400 | `:id` no es UUID válido |
| 401 | Token ausente o rechazado |
| 404 | Asignación no encontrada |

---

### Configuración de Colegios — `/school-configs`

#### GET /school-configs/school-ids — Listar IDs de colegios registrados

**Status OK:** 200 → array de UUIDs

**Respuesta:**
```json
[
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333"
]
```

---

## 7. Códigos de Respuesta

| HTTP | Situación |
|---|---|
| 200 OK | Consulta o actualización exitosa |
| 201 Created | Recurso creado exitosamente |
| 204 No Content | Eliminación exitosa (sin body) |
| 400 Bad Request | UUID malformado, body inválido según Zod, validación de cuenta fallida, o violación de restricciones de negocio |
| 401 Unauthorized | Token Bearer ausente, mal formado, o rechazado por el servicio de seguridad |
| 404 Not Found | Recurso no existe en base de datos |
| 409 Conflict | Violación de unicidad (ej. `accountId` duplicado en proveedores) |
| 429 Too Many Requests | Rate limit excedido (configurable, default 120 req/min) |
| 500 Internal Server Error | Error inesperado no controlado |

### Estructura de Errores JSON

```json
{
  "error": "Unauthorized",
  "message": "Missing Bearer token"
}
```

Para errores de validación Zod:
```json
{
  "formErrors": [],
  "fieldErrors": {
    "accountId": ["Invalid uuid"],
    "name": ["String must contain at least 1 character(s)"]
  }
}
```

Para errores de rate limit:
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded, retry in 60 seconds",
  "statusCode": 429
}
```

---

## 8. Casos de Uso Implementados

### Proveedores (5)

| Caso de Uso | Archivo | Descripción |
|---|---|---|
| RegisterProviderUseCase | `register-provider.use-case.ts` | Crea un nuevo proveedor. Valida unicidad de `accountId`. |
| FindAllProvidersUseCase | `find-all-providers.use-case.ts` | Lista todos los proveedores registrados. |
| FindProviderByAccountIdUseCase | `find-provider-by-account-id.use-case.ts` | Busca un proveedor por `accountId`. |
| UpdateProviderUseCase | `update-provider.use-case.ts` | Actualiza datos del proveedor. |
| DeleteProviderUseCase | `delete-provider.use-case.ts` | Elimina proveedor (solo si no tiene cafeterías ni trabajadores). |

### Cafeterías (6)

| Caso de Uso | Archivo | Descripción |
|---|---|---|
| RegisterCafeteriaUseCase | `register-cafeteria.use-case.ts` | Crea cafetería. Valida existencia del proveedor. |
| FindAllCafeteriasUseCase | `find-all-cafeterias.use-case.ts` | Lista todas las cafeterías. |
| FindCafeteriaByIdUseCase | `find-cafeteria-by-id.use-case.ts` | Busca cafetería por ID. |
| FindCafeteriasByProviderIdUseCase | `find-cafeterias-by-provider-id.use-case.ts` | Cafeterías operadas por un proveedor. |
| UpdateCafeteriaUseCase | `update-cafeteria.use-case.ts` | Actualiza datos de la cafetería. Valida proveedor si se cambia. |
| DeleteCafeteriaUseCase | `delete-cafeteria.use-case.ts` | Elimina cafetería (solo si no tiene asignaciones). |

### Trabajadores y Asignaciones (12)

| Caso de Uso | Archivo | Descripción |
|---|---|---|
| RegisterWorkerUseCase | `register-worker.use-case.ts` | Registra trabajador. **Valida cuenta en servicio de seguridad.** Valida existencia del proveedor. |
| UpdateWorkerUseCase | `update-worker.use-case.ts` | Actualiza trabajador. **Valida cuenta si cambia accountId.** |
| DeleteWorkerUseCase | `delete-worker.use-case.ts` | Elimina trabajador (solo si no tiene asignaciones). |
| FindAllWorkersUseCase | `find-all-workers.use-case.ts` | Lista todos los trabajadores. |
| FindWorkerByIdUseCase | `find-worker-by-id.use-case.ts` | Busca trabajador por ID. |
| FindWorkerByAccountIdUseCase | `find-worker-by-account-id.use-case.ts` | Busca trabajador por accountId. |
| FindWorkersByProviderIdUseCase | `find-workers-by-provider-id.use-case.ts` | Trabajadores de un proveedor. |
| AssignWorkerCafeteriaUseCase | `assign-worker-cafeteria.use-case.ts` | Asigna trabajador a cafetería. Valida existencia de ambos. |
| DeleteWorkerAssignmentUseCase | `delete-worker-assignment.use-case.ts` | Elimina asignación. |
| FindAllWorkerAssignmentsUseCase | `find-all-worker-assignments.use-case.ts` | Lista todas las asignaciones. |
| FindWorkerAssignmentsByWorkerIdUseCase | `find-worker-assignments-by-worker-id.use-case.ts` | Asignaciones de un trabajador. |
| FindWorkerAssignmentsByCafeteriaIdUseCase | `find-worker-assignments-by-cafeteria-id.use-case.ts` | Personal asignado a una cafetería. |

### Configuración de Colegios (1)

| Caso de Uso | Archivo | Descripción |
|---|---|---|
| FindAllSchoolIdsUseCase | `find-all-school-ids.use-case.ts` | Lista IDs de colegios registrados en la tabla de configuración. |

---

## 9. Infraestructura y Despliegue

### Variables de Entorno

| Variable | Descripción | Uso / Ejemplo |
|---|---|---|
| `DB_HOST` | Host de PostgreSQL | *(infraestructura interna)* |
| `DB_PORT` | Puerto de PostgreSQL | 5432 |
| `DB_USER` | Usuario de la base de datos | *(credenciales seguras)* |
| `DB_PASSWORD` | Contraseña de la base de datos | *(credenciales seguras)* |
| `DB_NAME` | Nombre de la base de datos | ubicaciones |
| `DB_MAX_CONNECTIONS` | Máximo de conexiones al pool | 10 |
| `DB_IDLE_TIMEOUT` | Timeout de conexión inactiva (ms) | 30000 |
| `DB_CONNECTION_TIMEOUT` | Timeout de conexión (ms) | 2000 |
| `NODE_ENV` | Entorno de ejecución | `production` |
| `HOST` | Host del servidor Fastify | 0.0.0.0 |
| `PORT` | Puerto del servidor Fastify | 8080 |
| `CORS_ORIGINS` | Orígenes permitidos (separados por coma) | *(dominios autorizados)* |
| `RATE_LIMIT_MAX` | Máximo de requests por ventana | 120 |
| `RATE_LIMIT_TIME_WINDOW` | Ventana de rate limiting | 1 minute |
| `SECURITY_SERVICE_URL` | URL base del servicio de seguridad | `https://mriai.coreunimag.com/api/auth` |
| `SECURITY_ME_PATH` | Ruta de introspección del token | `/me` |
| `SECURITY_ACCOUNT_CHECK_PATH_TEMPLATE` | Template para validar cuentas de trabajadores | `/users/:id` |
| `SECURITY_ACCOUNT_CHECK_METHOD` | Método HTTP para validar cuentas | `GET` |
| `SECURITY_SERVICE_TOKEN` | Token service-to-service (opcional) | *(si aplica)* |

### Docker Compose

El servicio se conteneriza con Docker y PostgreSQL 16:

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: ubicaciones
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d ubicaciones"]
    volumes:
      - ./migrations/provider-service-schema.sql (DDL + seed automático)

  provider-service:
    build: .
    depends_on:
      postgres: { condition: service_healthy }
    ports:
      - "8080:8080"
    environment:
      SECURITY_SERVICE_URL: https://mriai.coreunimag.com/api/auth
      SECURITY_ME_PATH: /me
      SECURITY_ACCOUNT_CHECK_PATH_TEMPLATE: /users/:id
```

### Scripts

| Script | Comando | Descripción |
|---|---|---|
| `dev` | `tsx watch -r tsconfig-paths/register src/app.ts` | Desarrollo con hot reload |
| `dev:bun` | `bun --watch src/app.ts` | Desarrollo con Bun |
| `build` | `tsc -p tsconfig.build.json && tsc-alias -p tsconfig.build.json` | Build de producción |
| `start` | `node dist/app.js` | Ejecutar build de producción |
| `drizzle:generate` | `drizzle-kit generate` | Generar migraciones |
| `drizzle:push` | `drizzle-kit push` | Aplicar schema a base de datos |

### Gestión de Migraciones

Drizzle Kit (`drizzle-kit generate` / `drizzle-kit push`). El schema inicial y seed se aplican automáticamente al levantar el contenedor PostgreSQL con el archivo `provider-service-schema.sql` montado en `/docker-entrypoint-initdb.d/`.

---

## 10. Observabilidad y Calidad

### Logging

Pino emite logs estructurados en JSON (nivel `info`) listos para ser ingestados por agentes externos (Prometheus, FluentBit, Datadog). Opcionalmente, Pino-pretty puede transformar la salida a formato legible por humanos con colores y timestamps.

### Manejo de Errores

Jerarquía de errores de aplicación:
```
AppError (code: string)
  └── ValidationError (field, promptedValue, expectedFormat)
       └── InvalidUuidError
```

El error handler global de Fastify captura:
1. **Errores de validación Zod** → 400 con estructura `fieldErrors`.
2. **Errores con `statusCode`** → responde con ese código HTTP.
3. **Errores no controlados** → 500 con mensaje genérico.

### Rate Limiting

- Default: 120 requests por minuto por IP.
- Headers de respuesta: `x-ratelimit-limit`, `x-ratelimit-remaining`, `x-ratelimit-reset`, `retry-after`.
- El endpoint `/health` está exento de rate limiting.

### CORS

Solo se permiten los orígenes explícitos definidos en la variable de entorno `CORS_ORIGINS`.
- Métodos permitidos: GET, POST, PUT, PATCH, DELETE, OPTIONS.
- Headers permitidos: Content-Type, Authorization.
- Credenciales: habilitadas.
- Preflight cache: 86400 segundos (24 horas).

---

## 11. Colección Postman (Pruebas Automatizadas)

El directorio `postman/` contiene la colección completa con **60+ requests** automatizados por cada endpoint:

### Carpetas de la Colección

| Carpeta | Requests | Descripción |
|---|---|---|
| **Security Auth** | 3 | Request PIN → Login (OTP) → Get Me. Obtiene `ACCESS_TOKEN` del servicio de seguridad real. |
| **Providers** | 13 | CRUD completo con escenarios: OK, Duplicate Account (409), Validation Error, Invalid UUID (400), Not Found (404), Delete con preparación y limpieza. |
| **Cafeterias** | 13 | CRUD completo con escenarios: OK, Provider Not Found, Invalid UUID, Not Found, Delete con preparación y limpieza. |
| **Workers** | 13 | CRUD completo con escenarios: OK, Provider Not Found, Invalid UUID, Not Found, Delete con preparación y limpieza. |
| **Assignments** | 10 | Asignación, listado por worker/cafetería, eliminación, con escenarios: OK, Missing Worker, Invalid UUID, Not Found. |
| **School Configs** | 1 | Get School IDs con validación de respuesta array. |

### Variables de Entorno Postman

| Variable | Descripción |
|---|---|
| `BASE_URL` | URL base del servicio (local: `http://localhost:8080`) |
| `ACCESS_TOKEN` | Token JWT obtenido del flujo de autenticación |
| `SECURITY_BASE_URL` | URL del servicio de seguridad |
| `IDENTIFICADOR_ACCESO` | Identificador para login (teléfono/email) |
| `PIN_ACCESO` | PIN OTP recibido |
| `PROVIDER_ACCOUNT_ID` | UUID de cuenta del proveedor |
| `WORKER_ACCOUNT_ID` | UUID de cuenta del trabajador (obtenido de /me) |
| `SCHOOL_ID` | UUID del colegio |
| `MISSING_UUID` | UUID que no existe (para pruebas 404) |

### Flujo Recomendado

```
1) Security Auth: Request PIN → Login (OTP) → Get Me
   (El token se almacena automáticamente en ACCESS_TOKEN)
   (El ID de usuario se almacena en WORKER_ACCOUNT_ID)
2) Providers: Create → List → Get by AccountId → Update → Delete
3) Cafeterias: Create → List → Get by Id → Get by Provider → Update → Delete
4) Workers: Create → List → Get by Id → Get by Provider → Update → Delete
5) Assignments: Assign → List → Get by Worker → Get by Cafeteria → Delete
6) School Configs: Get School IDs
```

### Tests Automatizados por Request

Cada request incluye scripts de test que:
- Verifican el status code esperado (200, 201, 204, 400, 404).
- Extraen IDs de las respuestas y los guardan en variables de entorno para requests posteriores.
- Validan que las respuestas de listado sean arrays.

---

## 12. Reglas de Integridad del Negocio

Implementadas en los Casos de Uso y reforzadas por restricciones de clave foránea en PostgreSQL (`ON DELETE CASCADE`):

1. **Eliminación en cascada:** Al eliminar un proveedor, se eliminan automáticamente sus cafeterías y trabajadores asociados.
2. **Eliminación en cascada:** Al eliminar una cafetería, se eliminan automáticamente las asignaciones de trabajadores activas.
3. **Eliminación en cascada:** Al eliminar un trabajador, se eliminan automáticamente sus asignaciones activas.
4. **No se puede crear** una cafetería referenciando un `id_proveedor` inexistente → 400/404.
5. **No se puede crear** un trabajador referenciando un `id_proveedor` inexistente → 400/404.
6. **No se puede crear** un trabajador con un `accountId` que no existe en el servicio de seguridad → 400.
7. **No se puede crear** una asignación con `id_trabajador` o `id_cafeteria` inexistente → 400/404.
8. Un `accountId` no puede estar duplicado en proveedores → 409 Conflict.
9. Todo identificador recibido en ruta o body debe ser un UUID válido → 400 Bad Request.
10. Al actualizar un trabajador con nuevo `accountId`, este debe existir en el servicio de seguridad.

---

## 13. Datos de Seed

El archivo `provider-service-schema.sql` incluye datos iniciales idempotentes (`ON CONFLICT DO NOTHING`):

| Entidad | Registros |
|---|---|
| colegios_db_config | 3 colegios apuntando a `school-db-[1-3].internal:5432` |
| proveedores | Proveedor Uno S.A.S (NIT-900111111) y Proveedor Dos S.A.S (NIT-900222222) |
| cafeterias | Cafetería Central A (Colegio 1 / Proveedor 1) y Cafetería Central B (Colegio 2 / Proveedor 2) |

---

*Ingeniería de Software — Universidad Del Magdalena*
*Fecha de actualización: 28 de abril de 2026*
*Versión: 1.0.0*
