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

CREATE TABLE IF NOT EXISTS public.proveedores (
    id_proveedor uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    id_account uuid NOT NULL,
    nombre_proveedor varchar(255) NOT NULL,
    registro_empresa_proveedor varchar(100),
    email_contacto_proveedor varchar(255),
    telefono_contacto_proveedor varchar(50),
    creado_en timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cafeterias (
    id_cafeteria uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    id_colegio uuid NOT NULL,
    id_proveedor uuid NOT NULL REFERENCES public.proveedores(id_proveedor),
    nombre_cafeteria varchar(255),
    creado_en timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trabajadores (
    id_trabajador uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    id_account uuid NOT NULL,
    id_proveedor uuid NOT NULL REFERENCES public.proveedores(id_proveedor),
    estado_empleo_trabajador public.estado_empleo_trabajador_enum DEFAULT 'activo',
    cargo_trabajador varchar(100),
    tipo_contrato_trabajador varchar(100),
    fecha_contratacion_trabajador date,
    salario_trabajador numeric(10,2),
    creado_en timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.asignaciones_trabajadores (
    id_asignacion_trabajador uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    id_trabajador uuid NOT NULL REFERENCES public.trabajadores(id_trabajador),
    id_cafeteria uuid NOT NULL REFERENCES public.cafeterias(id_cafeteria),
    rol_trabajador varchar(100),
    fecha_inicio_asignacion date,
    fecha_fin_asignacion date
);
