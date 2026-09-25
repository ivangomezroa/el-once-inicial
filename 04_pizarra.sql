-- ══════════════════════════════════════════════════════════════════
-- EL ONCE INICIAL — Pizarra y planilla de sesión en la nube
--
-- Hasta ahora la pizarra y la planilla guardaban SOLO en el navegador:
-- si cambiabas de dispositivo, no estaban. Esto añade sus tres tablas.
--
--   tareas    → una fila por tarea de la librería (pz_tasks_v3)
--   sesiones  → una fila por planilla de sesión  (pz_sessions)
--   ajustes   → una fila por cosa que no es una lista: el modelo de
--               juego, los tipos de tarea, la plantilla de 24 y el
--               escudo del equipo
--
-- Fila por tarea y por sesión, y no un único bloque, para que dos
-- personas del cuerpo técnico puedan tocar tareas distintas sin
-- pisarse, y para que un borrado se pueda mandar de una en una.
--
-- Aplicar después de 01, 02 y 03. Idempotente: se puede volver a
-- ejecutar sin romper nada.
-- ══════════════════════════════════════════════════════════════════

-- ─────────────────────────── TAREAS ───────────────────────────
-- `datos` es la tarea tal cual la guarda la pizarra, sin traducir.
-- Los campos de fuera solo sirven para listar y buscar sin abrirla.
create table if not exists public.tareas (
  id              uuid primary key default gen_random_uuid(),
  espacio_id      uuid not null references public.espacios(id) on delete cascade,
  id_local        text,
  nombre          text not null default '',
  fase            text,
  datos           jsonb not null default '{}'::jsonb,
  creado_por      uuid references public.perfiles(id) on delete set null,
  actualizado_por uuid references public.perfiles(id) on delete set null,
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);
create index if not exists idx_tareas_espacio on public.tareas(espacio_id, actualizado_en desc);

-- ─────────────────────────── SESIONES ──────────────────────────
create table if not exists public.sesiones (
  id              uuid primary key default gen_random_uuid(),
  espacio_id      uuid not null references public.espacios(id) on delete cascade,
  id_local        text,
  numero          integer,
  fecha           text,
  datos           jsonb not null default '{}'::jsonb,
  creado_por      uuid references public.perfiles(id) on delete set null,
  actualizado_por uuid references public.perfiles(id) on delete set null,
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);
create index if not exists idx_sesiones_espacio on public.sesiones(espacio_id, fecha);

-- ─────────────────────────── AJUSTES ───────────────────────────
-- Lo que no es una lista: un valor por clave y espacio. La clave es
-- la misma que usa el navegador (pz_mdj, pz_tipos…), así no hay que
-- recordar dos nombres para la misma cosa.
create table if not exists public.ajustes (
  espacio_id      uuid not null references public.espacios(id) on delete cascade,
  clave           text not null,
  datos           jsonb not null default '{}'::jsonb,
  actualizado_por uuid references public.perfiles(id) on delete set null,
  actualizado_en  timestamptz not null default now(),
  primary key (espacio_id, clave)
);

-- ── Un id_local solo una vez por espacio ──
-- Es lo que permite volver a subir sin crear copias (ON CONFLICT).
-- El índice NO puede ser parcial: Postgres no acepta un índice parcial
-- como objetivo de ON CONFLICT sin repetir su condición, y la API de
-- Supabase no sabe expresarla. Con uno normal basta, porque cada NULL
-- cuenta como distinto.
drop index if exists ux_tareas_local;
drop index if exists ux_sesiones_local;
create unique index if not exists ux_tareas_local   on public.tareas(espacio_id, id_local);
create unique index if not exists ux_sesiones_local on public.sesiones(espacio_id, id_local);

-- ── Fecha de actualización automática ──
drop trigger if exists tg_tareas_upd   on public.tareas;
drop trigger if exists tg_sesiones_upd on public.sesiones;
drop trigger if exists tg_ajustes_upd  on public.ajustes;
create trigger tg_tareas_upd   before update on public.tareas
  for each row execute function public.fn_marca_actualizado();
create trigger tg_sesiones_upd before update on public.sesiones
  for each row execute function public.fn_marca_actualizado();
create trigger tg_ajustes_upd  before update on public.ajustes
  for each row execute function public.fn_marca_actualizado();

-- ── Seguridad por filas: mismo patrón que informes y jugadores ──
-- Leen los miembros del espacio; escriben los que pueden editar.
alter table public.tareas   enable row level security;
alter table public.sesiones enable row level security;
alter table public.ajustes  enable row level security;

do $$
declare t text;
begin
  foreach t in array array['tareas','sesiones','ajustes'] loop
    execute format('drop policy if exists p_%1$s_sel on public.%1$s', t);
    execute format('create policy p_%1$s_sel on public.%1$s for select using (public.es_miembro(espacio_id))', t);
    execute format('drop policy if exists p_%1$s_ins on public.%1$s', t);
    execute format('create policy p_%1$s_ins on public.%1$s for insert with check (public.puede_editar(espacio_id))', t);
    execute format('drop policy if exists p_%1$s_upd on public.%1$s', t);
    execute format('create policy p_%1$s_upd on public.%1$s for update using (public.puede_editar(espacio_id)) with check (public.puede_editar(espacio_id))', t);
    execute format('drop policy if exists p_%1$s_del on public.%1$s', t);
    execute format('create policy p_%1$s_del on public.%1$s for delete using (public.puede_editar(espacio_id))', t);
  end loop;
end $$;

-- ── Comprobación ──
select 'tareas'   as tabla, count(*) from public.tareas
union all select 'sesiones', count(*) from public.sesiones
union all select 'ajustes',  count(*) from public.ajustes;
