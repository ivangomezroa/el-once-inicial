-- ════════════════════════════════════════════════════════════════
--  08_cargos.sql · El cargo de cada miembro
--  14 de noviembre de 2026
--
--  Los ROLES son permisos (qué puede tocar cada uno) y se quedan como
--  están: propietario, entrenador, analista, invitado. El CARGO es otra
--  cosa: qué es esa persona en el cuerpo técnico (segundo entrenador,
--  preparador físico, director deportivo…). Mezclarlos era el error:
--  un preparador físico y un segundo entrenador tienen el mismo permiso
--  y son cargos distintos.
--
--  Se puede ejecutar varias veces sin romper nada.
-- ════════════════════════════════════════════════════════════════

alter table public.miembros     add column if not exists cargo text;
alter table public.invitaciones add column if not exists cargo text;

comment on column public.miembros.cargo     is 'Cargo en el cuerpo técnico. No da permisos: los permisos son el rol.';
comment on column public.invitaciones.cargo is 'Cargo con el que entrará quien acepte la invitación.';

-- ── invitar(): ahora también lleva el cargo ──────────────────────
-- Se borra la versión de tres parámetros antes de crear la de cuatro:
-- si se dejaran las dos, PostgREST no sabría a cuál llamar.
drop function if exists public.invitar(uuid, text, rol_espacio);

create or replace function public.invitar(
  p_espacio uuid,
  p_email   text,
  p_rol     rol_espacio default 'entrenador',
  p_cargo   text default null
)
returns text language plpgsql security definer set search_path = public as $$
declare v_token text;
begin
  if not public.es_propietario(p_espacio) then
    raise exception 'Solo el propietario puede invitar';
  end if;
  insert into public.invitaciones (espacio_id, email, rol, cargo, invitado_por)
  values (p_espacio, lower(trim(p_email)), p_rol, nullif(trim(coalesce(p_cargo,'')),''), auth.uid())
  returning token into v_token;
  return v_token;
end $$;

-- ── aceptar_invitacion(): al entrar, se queda con su cargo ───────
create or replace function public.aceptar_invitacion(p_token text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_espacio uuid; v_rol rol_espacio; v_email text; v_mi_email text; v_cargo text;
begin
  if auth.uid() is null then raise exception 'Hay que iniciar sesión'; end if;

  select espacio_id, rol, email, cargo into v_espacio, v_rol, v_email, v_cargo
  from public.invitaciones
  where token = p_token and aceptada_en is null and caduca_en > now();

  if v_espacio is null then raise exception 'Invitación no válida o caducada'; end if;

  select email into v_mi_email from public.perfiles where id = auth.uid();
  if lower(coalesce(v_mi_email,'')) <> lower(v_email) then
    raise exception 'Esta invitación es para otro correo';
  end if;

  insert into public.miembros (espacio_id, perfil_id, rol, cargo)
  values (v_espacio, auth.uid(), v_rol, v_cargo)
  on conflict (espacio_id, perfil_id) do update
    set rol   = excluded.rol,
        -- si la invitación no trae cargo, se respeta el que ya tuviera
        cargo = coalesce(excluded.cargo, public.miembros.cargo);

  update public.invitaciones set aceptada_en = now() where token = p_token;
  return v_espacio;
end $$;

-- Permisos de la Data API para las columnas nuevas: se heredan de la
-- tabla, pero se dejan dichos por si la base se monta desde cero.
grant select, insert, update, delete on public.miembros     to authenticated;
grant select, insert, update, delete on public.invitaciones to authenticated;
