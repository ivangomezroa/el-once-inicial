-- ══════════════════════════════════════════════════════════════════
-- EL ONCE INICIAL — Almacén de imágenes
--
-- Aquí van escudos, fotos de campo, de equipación y de jugadores.
-- Cada imagen se guarda en una carpeta por espacio:
--     imagenes/<id-del-espacio>/<huella>.png
--
-- La "huella" se calcula a partir del contenido de la imagen. Dos
-- escudos idénticos dan la misma huella, así que el segundo no se
-- sube: se reutiliza el enlace del primero. Eso es lo que impide
-- que vuelvan los duplicados.
--
-- El contenido de los informes ya no guarda la imagen, guarda su
-- enlace. Un enlace ocupa una línea de texto en lugar de 800 KB.
--
-- Aplicar después de 01_esquema.sql.
-- ══════════════════════════════════════════════════════════════════

-- Cubo privado. 5 MB por archivo es de sobra: tras comprimir, un
-- escudo pesa ~15 KB y una foto de campo ~200 KB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('imagenes','imagenes', false, 5242880,
        array['image/png','image/jpeg','image/webp','image/svg+xml'])
on conflict (id) do update
  set public = false,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/png','image/jpeg','image/webp','image/svg+xml'];

-- Reglas: cada uno solo entra en las carpetas de sus espacios.
-- La primera carpeta del nombre es el id del espacio.
drop policy if exists p_img_leer on storage.objects;
create policy p_img_leer on storage.objects for select
  using (
    bucket_id = 'imagenes'
    and public.es_miembro_txt((storage.foldername(name))[1])
  );

drop policy if exists p_img_subir on storage.objects;
create policy p_img_subir on storage.objects for insert
  with check (
    bucket_id = 'imagenes'
    and public.es_miembro_txt((storage.foldername(name))[1])
  );

drop policy if exists p_img_reemplazar on storage.objects;
create policy p_img_reemplazar on storage.objects for update
  using (
    bucket_id = 'imagenes'
    and public.es_miembro_txt((storage.foldername(name))[1])
  );

drop policy if exists p_img_borrar on storage.objects;
create policy p_img_borrar on storage.objects for delete
  using (
    bucket_id = 'imagenes'
    and public.es_miembro_txt((storage.foldername(name))[1])
  );

-- Registrar una imagen sin duplicarla: si esa huella ya existe en el
-- espacio, devuelve el enlace que ya había y suma un uso. Si no,
-- guarda la nueva. La app llama a esto antes de subir nada.
create or replace function public.registrar_imagen(
  p_espacio uuid, p_huella text, p_url text, p_ruta text,
  p_bytes integer default null, p_ancho integer default null, p_alto integer default null
) returns text language plpgsql security definer set search_path = public as $$
declare v_url text;
begin
  if not public.puede_editar(p_espacio) then
    raise exception 'Sin permiso para escribir en este espacio';
  end if;

  select url into v_url from public.imagenes
  where espacio_id = p_espacio and huella = p_huella;

  if v_url is not null then
    update public.imagenes set usos = usos + 1
    where espacio_id = p_espacio and huella = p_huella;
    return v_url;
  end if;

  insert into public.imagenes (espacio_id, huella, url, ruta, bytes, ancho, alto)
  values (p_espacio, p_huella, p_url, p_ruta, p_bytes, p_ancho, p_alto);
  return p_url;
end $$;

-- ¿Ya tengo esta imagen? La app pregunta antes de subir, para no
-- gastar datos móviles subiendo un escudo que ya está.
create or replace function public.buscar_imagen(p_espacio uuid, p_huella text)
returns text language sql security definer stable set search_path = public as $$
  select url from public.imagenes
  where espacio_id = p_espacio and huella = p_huella
    and public.es_miembro(p_espacio);
$$;
