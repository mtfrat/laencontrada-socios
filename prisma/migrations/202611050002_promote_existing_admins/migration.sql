-- Los administradores existentes ya podían gestionar cuentas. Conservan ese permiso.
UPDATE "Usuario" SET "role" = 'SUPER_ADMIN' WHERE "role" = 'ADMIN';
UPDATE "Usuario" SET "role" = 'EQUIPO' WHERE "role" IN ('MOZO', 'BARRA', 'CAJERO');
