-- ══════════════════════════════════════════════════════════════════
-- EL ONCE INICIAL — Campogramas de Captación
--
-- Cada campograma es un equipo con su escudo, su sistema y sus
-- jugadores colocados. Vivían solo en el navegador (`oi_campogramas_v1`),
-- así que no viajaban al móvil ni a la nube. Esta tabla los sube.
--
-- Mismo patrón que informes, jugadores, rivales y eventos:
--   · `espacio_id` + RLS: solo ve y escribe quien es del espacio.
--   · `id_local` con índice único por espacio: subir dos veces
--     actualiza en lugar de duplicar.
--   · Todo el campograma entero va en `datos`; las columnas sueltas
--     son para poder mirarlo desde el panel sin abrir el JSON.
--
-- Aplicar después de 01, 02 y 03. Idempotente: se puede ejecutar
-- las veces que haga falta sin romper ni borrar nada.
-- ══════════════════════════════════════════════════════════════════

create table if not exists public.campogramas (
  id              uuid primary key default gen_random_uuid(),
  espacio_id      uuid not null references public.espacios(id) on delete cascade,
  id_local        text,
  nombre          text not null default '',
  categoria       text not null default '',
  sistema         text not null default '',
  datos           jsonb not null default '{}'::jsonb,
  creado_por      uuid references public.perfiles(id) on delete set null,
  actualizado_por uuid references public.perfiles(id) on delete set null,
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);

create index if not exists idx_campogramas_espacio
  on public.campogramas(espacio_id, actualizado_en desc);

-- El índice NO puede ser parcial: Postgres no acepta un índice parcial
-- como objetivo de ON CONFLICT sin repetir su condición, y la API de
-- Supabase no puede expresarla. Con uno normal basta, porque cada NULL
-- se considera distinto.
drop index if exists ux_campogramas_local;
create unique index if not exists ux_campogramas_local
  on public.campogramas(espacio_id, id_local);

alter table public.campogramas enable row level security;

-- Lo leen los miembros del espacio; lo escriben los que pueden editar.
-- Exactamente las mismas reglas que el resto del contenido.
do $$
declare t text := 'campogramas';
begin
  execute format('drop policy if exists p_%1$s_sel on public.%1$s', t);
  execute format('create policy p_%1$s_sel on public.%1$s for select using (public.es_miembro(espacio_id))', t);
  execute format('drop policy if exists p_%1$s_ins on public.%1$s', t);
  execute format('create policy p_%1$s_ins on public.%1$s for insert with check (public.puede_editar(espacio_id))', t);
  execute format('drop policy if exists p_%1$s_upd on public.%1$s', t);
  execute format('create policy p_%1$s_upd on public.%1$s for update using (public.puede_editar(espacio_id)) with check (public.puede_editar(espacio_id))', t);
  execute format('drop policy if exists p_%1$s_del on public.%1$s', t);
  execute format('create policy p_%1$s_del on public.%1$s for delete using (public.puede_editar(espacio_id))', t);
end $$;

drop trigger if exists trg_campogramas_upd on public.campogramas;
create trigger trg_campogramas_upd before update on public.campogramas
  for each row execute function public.fn_marca_actualizado();
