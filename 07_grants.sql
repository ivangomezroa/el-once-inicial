-- ══════════════════════════════════════════════════════════════════
-- EL ONCE INICIAL — Permisos explícitos de la Data API
--
-- Desde el 30 de octubre de 2026, Supabase deja de dar permisos
-- automáticamente a las tablas nuevas del esquema `public`. Las que ya
-- existen conservan los suyos, así que ESTO NO ARREGLA NADA QUE ESTÉ
-- ROTO HOY: lo que hace es dejar el esquema completo, para que volver a
-- montarlo desde estos ficheros (proyecto nuevo, rama de pruebas,
-- `supabase db reset`) siga funcionando.
--
-- Sin esto, replicar el esquema deja las 13 tablas sin un solo permiso
-- y la app responde "permission denied" en todo. Comprobado en un
-- Postgres limpio.
--
-- POR QUÉ NO SE LE DA NADA A `anon`:
--   El correo de Supabase propone de ejemplo `grant select ... to anon`.
--   Aquí no hace falta y además sería abrir la mano sin motivo: la app
--   exige iniciar sesión antes de tocar la Data API. Lo único que se usa
--   sin sesión es la función `latido()`, que ya tiene su propio permiso
--   en 05_latido.sql, y las funciones conservan el permiso de ejecución
--   por defecto. Si algún día algo tuviera que leerse sin sesión, se
--   añade aquí y solo para esa tabla.
--
-- Quien manda sobre quién ve qué sigue siendo la RLS de 01_esquema.sql:
-- estos permisos solo abren la puerta de la API, las políticas deciden
-- qué filas se ven. Las dos cosas hacen falta.
--
-- Aplicar al final, después de 01..06. Idempotente.
-- ══════════════════════════════════════════════════════════════════

do $$
declare t text;
begin
  foreach t in array array[
    'perfiles','espacios','miembros','informes','jugadores','rivales',
    'eventos','imagenes','invitaciones','campogramas',
    'tareas','sesiones','ajustes'
  ] loop
    -- Si algún día se añade una tabla a la lista antes de crearla, que
    -- avise en vez de reventar el script entero.
    if to_regclass('public.'||t) is null then
      raise notice 'La tabla public.% no existe todavía: me la salto', t;
      continue;
    end if;
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant select, insert, update, delete on public.%I to service_role', t);
  end loop;
end $$;

-- Para las tablas que se creen a partir de ahora sin acordarse de esto.
-- No afecta a las que ya existen; solo a las futuras.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
