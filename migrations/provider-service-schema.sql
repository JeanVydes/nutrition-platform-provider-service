BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'estado_empleo_trabajador_enum'
          AND n.nspname = 'public'
    ) THEN
        CREATE TYPE public.estado_empleo_trabajador_enum AS ENUM ('activo', 'suspendido', 'retirado');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.colegios_db_config (
    id_colegio uuid PRIMARY KEY,
    host_db varchar(255) NOT NULL,
    puerto_db integer NOT NULL,
    nombre_db varchar(255) NOT NULL,
    usuario_db varchar(255),
    nombre_colegio varchar(255),
    creado_en timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.proveedores (
    id_proveedor uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    id_account uuid NOT NULL,
    nombre_proveedor varchar(255) NOT NULL,
    registro_empresa_proveedor varchar(100),
    email_contacto_proveedor varchar(255),
    telefono_contacto_proveedor varchar(50),
    pais varchar(100),
    ciudad varchar(100),
    direccion_facturacion varchar(255),
    oficina varchar(100),
    creado_en timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cafeterias (
    id_cafeteria uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    id_colegio uuid NOT NULL,
    id_proveedor uuid NOT NULL REFERENCES public.proveedores(id_proveedor) ON DELETE CASCADE ON UPDATE CASCADE,
    nombre_cafeteria varchar(255),
    creado_en timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trabajadores (
    id_trabajador uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    id_account uuid NOT NULL,
    id_proveedor uuid NOT NULL REFERENCES public.proveedores(id_proveedor) ON DELETE CASCADE ON UPDATE CASCADE,
    estado_empleo_trabajador public.estado_empleo_trabajador_enum DEFAULT 'activo',
    cargo_trabajador varchar(100),
    tipo_contrato_trabajador varchar(100),
    fecha_contratacion_trabajador date,
    salario_trabajador numeric(10,2),
    creado_en timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.asignaciones_trabajadores (
    id_asignacion_trabajador uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    id_trabajador uuid NOT NULL REFERENCES public.trabajadores(id_trabajador) ON DELETE CASCADE ON UPDATE CASCADE,
    id_cafeteria uuid NOT NULL REFERENCES public.cafeterias(id_cafeteria) ON DELETE CASCADE ON UPDATE CASCADE,
    rol_trabajador varchar(100),
    fecha_inicio_asignacion date,
    fecha_fin_asignacion date
);

INSERT INTO public.colegios_db_config (id_colegio, host_db, puerto_db, nombre_db, usuario_db, nombre_colegio)
VALUES
    ('11111111-1111-4111-8111-111111111111', 'school-db-1.internal', 5432, 'school_1', 'school_user_1', 'Colegio Los Andes'),
    ('22222222-2222-4222-8222-222222222222', 'school-db-2.internal', 5432, 'school_2', 'school_user_2', 'Colegio San José'),
    ('33333333-3333-4333-8333-333333333333', 'school-db-3.internal', 5432, 'school_3', 'school_user_3', 'Instituto Técnico')
ON CONFLICT (id_colegio) DO NOTHING;

INSERT INTO public.proveedores (id_proveedor, id_account, nombre_proveedor, registro_empresa_proveedor, email_contacto_proveedor, telefono_contacto_proveedor)
VALUES
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '99999999-9999-4999-8999-999999999991', 'Proveedor Uno S.A.S', 'NIT-900111111', 'contacto1@proveedor.test', '+573001111111'),
    ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', '99999999-9999-4999-8999-999999999991', 'Proveedor Dos S.A.S', 'NIT-900222222', 'contacto2@proveedor.test', '+573002222222')
ON CONFLICT (id_proveedor) DO NOTHING;

INSERT INTO public.cafeterias (id_cafeteria, id_colegio, id_proveedor, nombre_cafeteria)
VALUES
    ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', '11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'Cafetería Central A'),
    ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', '22222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'Cafetería Central B')
ON CONFLICT (id_cafeteria) DO NOTHING;

COMMIT;
