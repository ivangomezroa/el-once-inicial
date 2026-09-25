-- ══════════════════════════════════════════════════════════════════
-- EL ONCE INICIAL — Latido, para que el proyecto no se pause
--
-- El plan gratuito de Supabase pausa el proyecto tras 7 días de poca
-- actividad. Su documentación dice que "unas pocas peticiones a la base
-- de datos al día durante la semana anterior" bastan para evitarlo.
--
-- Esta función es lo que llama el latido diario: no devuelve ningún
-- dato del equipo, solo la hora del servidor. Sirve para dos cosas:
--   1. Que la petición toque Postgres de verdad (una lectura que RLS
--      filtra a cero también lo tocaría, pero no habría forma de
--      distinguirla de una respuesta cacheada).
--   2. Poder comprobar que el latido funciona: si vuelve una hora, ha
--      llegado a la base de datos.
--
-- No expone nada: la hora del servidor no es un dato de nadie.
--
-- Aplicar después de 01..04. Idempotente.
-- ══════════════════════════════════════════════════════════════════

create or replace function public.latido()
returns timestamptz
language sql
stable
as $$ select now() $$;

-- La llama el latido sin sesión, así que tiene que poder ejecutarla
-- quien no ha entrado (anon). `security invoker` (el de por defecto)
-- significa que no gana ningún permiso por ejecutarla.
revoke all on function public.latido() from public;
grant execute on function public.latido() to anon, authenticated;

-- ── Comprobación ──
select public.latido() as hora_del_servidor;
