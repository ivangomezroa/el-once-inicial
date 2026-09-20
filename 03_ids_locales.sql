-- ══════════════════════════════════════════════════════════════════
-- EL ONCE INICIAL — Enganche con los identificadores de la app
--
-- La app ya tiene sus propios identificadores ("r_a1b2", "pl_x9y8"…)
-- guardados dentro de cada informe. Si al subir generásemos otros
-- nuevos, cada subida crearía duplicados en lugar de actualizar.
--
-- Con `id_local` cada fila recuerda de qué elemento de la app viene,
-- y subir dos veces actualiza en lugar de duplicar.
--
-- Aplicar después de 01 y 02. Idempotente.
-- ══════════════════════════════════════════════════════════════════

alter table public.informes   add column if not exists id_local text;
alter table public.jugadores  add column if not exists id_local text;
alter table public.rivales    add column if not exists id_local text;
alter table public.eventos    add column if not exists id_local text;

-- Un id_local solo puede aparecer una vez por espacio. Es lo que
-- permite "subir de nuevo" sin crear copias.
--
-- OJO: el índice NO puede ser parcial (`where id_local is not null`).
-- Postgres no acepta un índice parcial como objetivo de ON CONFLICT
-- sin repetir su condición, y la API de Supabase no puede expresarla.
-- Con un índice normal basta: Postgres considera cada NULL distinto,
-- así que las filas sin id_local no chocan entre sí.
drop index if exists ux_informes_local;
drop index if exists ux_jugadores_local;
drop index if exists ux_rivales_local;
drop index if exists ux_eventos_local;
create unique index if not exists ux_informes_local  on public.informes(espacio_id, id_local);
create unique index if not exists ux_jugadores_local on public.jugadores(espacio_id, id_local);
create unique index if not exists ux_rivales_local   on public.rivales(espacio_id, id_local);
create unique index if not exists ux_eventos_local   on public.eventos(espacio_id, id_local);

-- El nombre del rival venía con restricción de unicidad, y eso estorba:
-- dos rivales pueden llamarse igual en temporadas distintas, y el nombre
-- se puede corregir. La identidad la da id_local.
alter table public.rivales drop constraint if exists rivales_espacio_id_nombre_key;

-- Resumen de lo que hay subido, para poder enseñarlo en la app sin
-- descargar nada. Solo cuenta lo de los espacios de los que eres miembro.
create or replace function public.resumen_espacio(p_espacio uuid)
returns table (
  informes bigint, jugadores bigint, rivales bigint, eventos bigint,
  imagenes bigint, ultima_subida timestamptz
) language sql security definer stable set search_path = public as $$
  select
    (select count(*) from public.informes  where espacio_id = p_espacio),
    (select count(*) from public.jugadores where espacio_id = p_espacio),
    (select count(*) from public.rivales   where espacio_id = p_espacio),
    (select count(*) from public.eventos   where espacio_id = p_espacio),
    (select count(*) from public.imagenes  where espacio_id = p_espacio),
    greatest(
      (select max(actualizado_en) from public.informes  where espacio_id = p_espacio),
      (select max(actualizado_en) from public.jugadores where espacio_id = p_espacio)
    )
  where public.es_miembro(p_espacio);
$$;
