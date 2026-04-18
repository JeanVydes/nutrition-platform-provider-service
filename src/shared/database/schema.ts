import { pgTable, uuid, varchar, timestamp, pgEnum, decimal, date, integer, boolean } from "drizzle-orm/pg-core";

export const employmentStatusEnum = pgEnum('estado_empleo_trabajador_enum', ['activo', 'suspendido', 'retirado']);

export const schoolDbConfigs = pgTable("colegios_db_config", {
  id: uuid("id_colegio").primaryKey(),
  hostDb: varchar("host_db", { length: 255 }).notNull(),
  portDb: integer("puerto_db").notNull(),
  nameDb: varchar("nombre_db", { length: 255 }).notNull(),
  userDb: varchar("usuario_db", { length: 255 }),
  createdAt: timestamp("creado_en").defaultNow(),
});

export const providers = pgTable("proveedores", {
  id: uuid("id_proveedor").primaryKey().defaultRandom(),
  accountId: uuid("id_account").notNull(),
  name: varchar("nombre_proveedor", { length: 255 }).notNull(),
  companyRegistration: varchar("registro_empresa_proveedor", { length: 100 }),
  contactEmail: varchar("email_contacto_proveedor", { length: 255 }),
  contactPhone: varchar("telefono_contacto_proveedor", { length: 50 }),
  createdAt: timestamp("creado_en").defaultNow(),
});

export const cafeterias = pgTable("cafeterias", {
  id: uuid("id_cafeteria").primaryKey().defaultRandom(),
  schoolId: uuid("id_colegio").notNull(),
  providerId: uuid("id_proveedor").notNull().references(() => providers.id),
  name: varchar("nombre_cafeteria", { length: 255 }),
  createdAt: timestamp("creado_en").defaultNow(),
});

export const workers = pgTable("trabajadores", {
  id: uuid("id_trabajador").primaryKey().defaultRandom(),
  accountId: uuid("id_account").notNull(),
  providerId: uuid("id_proveedor").notNull().references(() => providers.id),
  employmentStatus: employmentStatusEnum("estado_empleo_trabajador").default('activo'),
  position: varchar("cargo_trabajador", { length: 100 }),
  contractType: varchar("tipo_contrato_trabajador", { length: 100 }),
  hireDate: date("fecha_contratacion_trabajador"),
  salary: decimal("salario_trabajador", { precision: 10, scale: 2 }),
  createdAt: timestamp("creado_en").defaultNow(),
});

export const students = pgTable("estudiantes", {
  id: uuid("id_estudiante").primaryKey().defaultRandom(),
  accountId: uuid("id_account").notNull(),
  schoolId: uuid("id_colegio").notNull(),
  createdAt: timestamp("creado_en").defaultNow(),
});

export const parents = pgTable("padres", {
  id: uuid("id_padre").primaryKey().defaultRandom(),
  accountId: uuid("id_account").notNull(),
  createdAt: timestamp("creado_en").defaultNow(),
});

export const parentStudents = pgTable("padres_estudiantes", {
  id: uuid("id_relacion_padre_estudiante").primaryKey().defaultRandom(),
  parentId: uuid("id_padre").notNull().references(() => parents.id),
  studentId: uuid("id_estudiante").notNull().references(() => students.id),
  createdAt: timestamp("creado_en").defaultNow(),
});

export const workerAssignments = pgTable("asignaciones_trabajadores", {
  id: uuid("id_asignacion_trabajador").primaryKey().defaultRandom(),
  workerId: uuid("id_trabajador").notNull().references(() => workers.id),
  cafeteriaId: uuid("id_cafeteria").notNull().references(() => cafeterias.id),
  role: varchar("rol_trabajador", { length: 100 }),
  startDate: date("fecha_inicio_asignacion"),
  endDate: date("fecha_fin_asignacion"),
});
