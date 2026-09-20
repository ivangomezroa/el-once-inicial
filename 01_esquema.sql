-- ══════════════════════════════════════════════════════════════════
-- EL ONCE INICIAL — Estructura de datos en Supabase
--
-- Pensada desde el principio para varios usuarios y varios cuerpos
-- técnicos ("espacios"), para no tener que rehacerla si la app se
-- comparte o se vende.
--
-- Ideas clave:
--   · Un ESPACIO es un cuerpo técnico / club. Todo el contenido
--     cuelga de un espacio, nunca de una persona suelta.
--   · Una PERSONA puede estar en varios espacios, con distinto rol.
--   · Las IMÁGENES se guardan UNA vez (identificadas por su huella)
--     y el contenido guarda solo el enlace. Fin de los duplicados.
--   · Nadie puede leer ni escribir datos de un espacio del que no
--     sea miembro. Lo impone la propia base de datos, no la app.
--
-- Cómo aplicarlo: Supabase → SQL Editor → pegar → Run.
-- Es idempotente: se puede ejecutar más de una vez sin romper nada.
-- ══════════════════════════════════════════════════════════════════

-- ─────────────────────────── ROLES ───────────────────────────
do $$ begin
  create type rol_espacio as enum ('propietario','entrenador','analista','invitado');
exception when duplicate_object then null; end $$;
-- propietario → todo, incluido invitar y borrar el espacio
-- entrenador  → crear y editar todo el contenido
-- analista    → crear y editar todo el contenido
-- invitado    → solo lectura (p. ej. un directivo, o una demo)


-- ───────────────────────── PERFILES ──────────────────────────
-- Espejo de la tabla de usuarios de Supabase, para poder mostrar
-- nombres sin dar acceso a la tabla de autenticación.
create table if not exists public.perfiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  nombre      text,
  creado_en   timestamptz not null default now()
);

-- Al registrarse alguien, se le crea el perfil automáticamente.
create or replace function public.fn_nuevo_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfiles (id, email, nombre)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'nombre',''), split_part(coalesce(new.email,'usuario'),'@',1))
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists trg_nuevo_usuario on auth.users;
create trigger trg_nuevo_usuario
  after insert on auth.users
  for each row execute function public.fn_nuevo_usuario();


-- ───────────────────────── ESPACIOS ──────────────────────────
create table if not exists public.espacios (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  escudo_url  text,
  temporada   text,
  plan        text not null default 'gratis',
  creado_por  uuid references public.perfiles(id) on delete set null,
  creado_en   timestamptz not null default now()
);

create table if not exists public.miembros (
  espacio_id  uuid not null references public.espacios(id) on delete cascade,
  perfil_id   uuid not null references public.perfiles(id) on delete cascade,
  rol         rol_espacio not null default 'entrenador',
  creado_en   timestamptz not null default now(),
  primary key (espacio_id, perfil_id)
);
create index if not exists idx_miembros_perfil on public.miembros(perfil_id);


-- ──────────────── AYUDANTES DE PERMISOS ─────────────────
-- Van con SECURITY DEFINER a propósito: si consultaran `miembros`
-- con las reglas normales, las reglas se llamarían a sí mismas.
create or replace function public.es_miembro(p_espacio uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.miembros
    where espacio_id = p_espacio and perfil_id = auth.uid()
  );
$$;

create or replace function public.puede_editar(p_espacio uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.miembros
    where espacio_id = p_espacio and perfil_id = auth.uid()
      and rol in ('propietario','entrenador','analista')
  );
$$;

create or replace function public.es_propietario(p_espacio uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.miembros
    where espacio_id = p_espacio and perfil_id = auth.uid() and rol = 'propietario'
  );
$$;

-- Igual que es_miembro pero tolerando texto que no sea un uuid
-- (lo usan las reglas de las imágenes, donde la carpeta es texto).
create or replace function public.es_miembro_txt(p_texto text)
returns boolean language plpgsql security definer stable set search_path = public as $$
declare v uuid;
begin
  begin v := p_texto::uuid; exception when others then return false; end;
  return public.es_miembro(v);
end $$;


-- ───────────────────────── CONTENIDO ─────────────────────────
-- El contenido va en `datos jsonb`: es exactamente la forma que ya
-- tienen los informes en la app, así que no hay que reescribirlos.
-- Los campos sueltos (nombre, fecha) están fuera solo para poder
-- listar y buscar rápido sin abrir el informe entero.

create table if not exists public.informes (
  id              uuid primary key default gen_random_uuid(),
  espacio_id      uuid not null references public.espacios(id) on delete cascade,
  tipo            text not null default 'equipo' check (tipo in ('equipo','jugador')),
  nombre          text not null default '',
  fecha           text,
  datos           jsonb not null default '{}'::jsonb,
  creado_por      uuid references public.perfiles(id) on delete set null,
  actualizado_por uuid references public.perfiles(id) on delete set null,
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);
create index if not exists idx_informes_espacio on public.informes(espacio_id, tipo, actualizado_en desc);

create table if not exists public.jugadores (
  id              uuid primary key default gen_random_uuid(),
  espacio_id      uuid not null references public.espacios(id) on delete cascade,
  nombre          text not null default '',
  equipo          text,
  posicion        text,
  estado          text,
  datos           jsonb not null default '{}'::jsonb,
  creado_por      uuid references public.perfiles(id) on delete set null,
  actualizado_por uuid references public.perfiles(id) on delete set null,
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);
create index if not exists idx_jugadores_espacio on public.jugadores(espacio_id, nombre);

create table if not exists public.rivales (
  id              uuid primary key default gen_random_uuid(),
  espacio_id      uuid not null references public.espacios(id) on delete cascade,
  nombre          text not null default '',
  escudo_url      text,
  creado_en       timestamptz not null default now(),
  unique (espacio_id, nombre)
);

create table if not exists public.eventos (
  id              uuid primary key default gen_random_uuid(),
  espacio_id      uuid not null references public.espacios(id) on delete cascade,
  fecha           date not null,
  tipo            text not null default 'partido-liga',
  datos           jsonb not null default '{}'::jsonb,
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);
create index if not exists idx_eventos_espacio on public.eventos(espacio_id, fecha);

-- Registro de imágenes. La huella (hash) es la identidad: si la
-- misma imagen se sube dos veces, la segunda ya está aquí y solo
-- se reutiliza su enlace. Esto es lo que mata los duplicados.
create table if not exists public.imagenes (
  espacio_id  uuid not null references public.espacios(id) on delete cascade,
  huella      text not null,
  url         text not null,
  ruta        text not null,
  bytes       integer,
  ancho       integer,
  alto        integer,
  usos        integer not null default 1,
  creado_en   timestamptz not null default now(),
  primary key (espacio_id, huella)
);


-- ──────────── FECHA DE ACTUALIZACIÓN AUTOMÁTICA ─────────────
create or replace function public.fn_marca_actualizado()
returns trigger language plpgsql as $$
begin
  new.actualizado_en := now();
  begin new.actualizado_por := auth.uid(); exception when others then null; end;
  return new;
end $$;

drop trigger if exists trg_informes_upd on public.informes;
create trigger trg_informes_upd before update on public.informes
  for each row execute function public.fn_marca_actualizado();

drop trigger if exists trg_jugadores_upd on public.jugadores;
create trigger trg_jugadores_upd before update on public.jugadores
  for each row execute function public.fn_marca_actualizado();


-- ──────────────────────── INVITACIONES ───────────────────────
create table if not exists public.invitaciones (
  id          uuid primary key default gen_random_uuid(),
  espacio_id  uuid not null references public.espacios(id) on delete cascade,
  email       text not null,
  rol         rol_espacio not null default 'entrenador',
  token       text not null unique default encode(gen_random_bytes(18),'hex'),
  invitado_por uuid references public.perfiles(id) on delete set null,
  caduca_en   timestamptz not null default now() + interval '14 days',
  aceptada_en timestamptz,
  creado_en   timestamptz not null default now()
);
create index if not exists idx_invitaciones_email on public.invitaciones(lower(email)) where aceptada_en is null;


-- ────────────────── FUNCIONES DE LA APP ──────────────────
-- Crear espacio: hay que hacerlo en una función porque si no, al
-- insertar el espacio todavía no eres miembro y las reglas te
-- bloquearían a ti mismo.
create or replace function public.crear_espacio(p_nombre text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Hay que iniciar sesión'; end if;
  if coalesce(trim(p_nombre),'') = '' then raise exception 'El espacio necesita un nombre'; end if;
  insert into public.espacios (nombre, creado_por) values (trim(p_nombre), auth.uid())
    returning id into v_id;
  insert into public.miembros (espacio_id, perfil_id, rol) values (v_id, auth.uid(), 'propietario');
  return v_id;
end $$;

-- Invitar a alguien por correo. Devuelve el token que va en el enlace.
create or replace function public.invitar(p_espacio uuid, p_email text, p_rol rol_espacio default 'entrenador')
returns text language plpgsql security definer set search_path = public as $$
declare v_token text;
begin
  if not public.es_propietario(p_espacio) then
    raise exception 'Solo el propietario puede invitar';
  end if;
  insert into public.invitaciones (espacio_id, email, rol, invitado_por)
  values (p_espacio, lower(trim(p_email)), p_rol, auth.uid())
  returning token into v_token;
  return v_token;
end $$;

-- Aceptar una invitación con su token.
create or replace function public.aceptar_invitacion(p_token text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_espacio uuid; v_rol rol_espacio; v_email text; v_mi_email text;
begin
  if auth.uid() is null then raise exception 'Hay que iniciar sesión'; end if;

  select espacio_id, rol, email into v_espacio, v_rol, v_email
  from public.invitaciones
  where token = p_token and aceptada_en is null and caduca_en > now();

  if v_espacio is null then raise exception 'Invitación no válida o caducada'; end if;

  select email into v_mi_email from public.perfiles where id = auth.uid();
  if lower(coalesce(v_mi_email,'')) <> lower(v_email) then
    raise exception 'Esta invitación es para otro correo';
  end if;

  insert into public.miembros (espacio_id, perfil_id, rol)
  values (v_espacio, auth.uid(), v_rol)
  on conflict (espacio_id, perfil_id) do update set rol = excluded.rol;

  update public.invitaciones set aceptada_en = now() where token = p_token;
  return v_espacio;
end $$;

-- Mis espacios, con mi rol en cada uno.
create or replace function public.mis_espacios()
returns table (id uuid, nombre text, escudo_url text, rol rol_espacio, miembros bigint)
language sql security definer stable set search_path = public as $$
  select e.id, e.nombre, e.escudo_url, m.rol,
         (select count(*) from public.miembros m2 where m2.espacio_id = e.id)
  from public.espacios e
  join public.miembros m on m.espacio_id = e.id and m.perfil_id = auth.uid()
  order by e.creado_en;
$$;


-- ═══════════════ REGLAS DE ACCESO (la parte importante) ═══════════════
-- Sin esto, cualquiera con la clave pública de la app podría leer
-- todos los jugadores. Con esto, la base de datos solo devuelve
-- filas de los espacios de los que eres miembro.

alter table public.perfiles      enable row level security;
alter table public.espacios      enable row level security;
alter table public.miembros      enable row level security;
alter table public.informes      enable row level security;
alter table public.jugadores     enable row level security;
alter table public.rivales       enable row level security;
alter table public.eventos       enable row level security;
alter table public.imagenes      enable row level security;
alter table public.invitaciones  enable row level security;

-- perfiles: el mío, y el de quien comparte espacio conmigo
drop policy if exists p_perfiles_sel on public.perfiles;
create policy p_perfiles_sel on public.perfiles for select using (
  id = auth.uid() or exists (
    select 1 from public.miembros a
    join public.miembros b on b.espacio_id = a.espacio_id
    where a.perfil_id = auth.uid() and b.perfil_id = public.perfiles.id
  )
);
drop policy if exists p_perfiles_upd on public.perfiles;
create policy p_perfiles_upd on public.perfiles for update using (id = auth.uid()) with check (id = auth.uid());

-- espacios
drop policy if exists p_espacios_sel on public.espacios;
create policy p_espacios_sel on public.espacios for select using (public.es_miembro(id));
drop policy if exists p_espacios_upd on public.espacios;
create policy p_espacios_upd on public.espacios for update using (public.es_propietario(id)) with check (public.es_propietario(id));
drop policy if exists p_espacios_del on public.espacios;
create policy p_espacios_del on public.espacios for delete using (public.es_propietario(id));

-- miembros
drop policy if exists p_miembros_sel on public.miembros;
create policy p_miembros_sel on public.miembros for select using (public.es_miembro(espacio_id));
drop policy if exists p_miembros_ins on public.miembros;
create policy p_miembros_ins on public.miembros for insert with check (public.es_propietario(espacio_id));
drop policy if exists p_miembros_upd on public.miembros;
create policy p_miembros_upd on public.miembros for update using (public.es_propietario(espacio_id)) with check (public.es_propietario(espacio_id));
drop policy if exists p_miembros_del on public.miembros;
create policy p_miembros_del on public.miembros for delete using (public.es_propietario(espacio_id) or perfil_id = auth.uid());

-- contenido: leen los miembros, escriben los que pueden editar
do $$
declare t text;
begin
  foreach t in array array['informes','jugadores','rivales','eventos','imagenes'] loop
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

-- invitaciones: las ve el propietario; y también quien fue invitado
drop policy if exists p_invit_sel on public.invitaciones;
create policy p_invit_sel on public.invitaciones for select using (
  public.es_propietario(espacio_id)
  or lower(email) = lower(coalesce((select email from public.perfiles where id = auth.uid()),''))
);
drop policy if exists p_invit_del on public.invitaciones;
create policy p_invit_del on public.invitaciones for delete using (public.es_propietario(espacio_id));
