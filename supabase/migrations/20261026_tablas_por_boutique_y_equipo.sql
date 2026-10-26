-- Stocky: movimientos, reservas, promociones y proveedores por boutique,
-- más gestión de equipo (activar/desactivar y cambiar rol).
-- Ejecutar completo en Supabase > SQL Editor. Es idempotente (se puede correr más de una vez).

-- ---------------------------------------------------------------------------
-- 1. Perfiles: cuentas activas / desactivadas
-- ---------------------------------------------------------------------------
alter table public.perfiles add column if not exists activo boolean not null default true;

-- productos: el SKU es único por boutique (lo usa el upsert onConflict 'boutique_id,sku')
create unique index if not exists productos_boutique_sku_key on public.productos (boutique_id, sku);

-- ---------------------------------------------------------------------------
-- 2. Helpers para RLS (security definer: leen perfiles sin depender de sus políticas)
--    Una cuenta desactivada devuelve null, así que no ve ni modifica nada.
-- ---------------------------------------------------------------------------
create or replace function public.auth_boutique_id()
returns public.perfiles.boutique_id%type
language sql stable security definer set search_path = public as $$
  select boutique_id from public.perfiles where id = auth.uid() and activo
$$;

create or replace function public.auth_rol()
returns text
language sql stable security definer set search_path = public as $$
  select rol::text from public.perfiles where id = auth.uid() and activo
$$;

create or replace function public.auth_es_gestion()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.auth_rol() in ('admin', 'developer'), false)
$$;

grant execute on function public.auth_boutique_id(), public.auth_rol(), public.auth_es_gestion() to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Tablas
-- ---------------------------------------------------------------------------
create table if not exists public.movimientos (
  boutique_id uuid not null default public.auth_boutique_id() references public.boutiques(id) on delete cascade,
  id text not null,
  fecha text not null,
  fecha_iso date,
  sku text not null,
  producto text not null,
  tipo text not null check (tipo in ('ingreso', 'egreso', 'ajuste')),
  cantidad integer not null,
  usuario text not null default '',
  origen_destino text not null default '',
  notas text not null default '',
  created_at timestamptz not null default now(),
  primary key (boutique_id, id)
);

create table if not exists public.reservas (
  boutique_id uuid not null default public.auth_boutique_id() references public.boutiques(id) on delete cascade,
  id text not null,
  codigo text not null,
  sku text not null,
  prenda text not null,
  categoria text not null default '',
  color text not null default '',
  talle text not null default '',
  precio_unitario numeric not null default 0,
  cantidad integer not null default 1,
  precio_total numeric not null default 0,
  sena numeric not null default 0,
  saldo_pendiente numeric not null default 0,
  metodo_pago_sena text not null default 'efectivo',
  cliente_nombre text not null,
  cliente_telefono text not null default '',
  cliente_notas text,
  creada_el text not null,
  vence_el text not null,
  estado text not null default 'activa' check (estado in ('activa', 'retirada', 'caducada')),
  retirada_el text,
  metodo_pago_saldo text,
  created_at timestamptz not null default now(),
  primary key (boutique_id, id)
);

create table if not exists public.promociones (
  boutique_id uuid not null default public.auth_boutique_id() references public.boutiques(id) on delete cascade,
  id text not null,
  titulo text not null,
  codigo text,
  tipo_descuento text not null check (tipo_descuento in ('porcentaje', 'monto_fijo', 'dos_por_uno')),
  valor_descuento numeric not null default 0,
  categoria text not null default 'Todas',
  aplica_a text not null default '',
  skus text[] not null default '{}',
  dia_semana text,
  fecha_inicio text not null default '',
  fecha_fin text not null default '',
  estado text not null default 'activa' check (estado in ('activa', 'programada', 'pausada', 'expirada')),
  compra_minima numeric,
  usos integer not null default 0,
  notas text,
  created_at timestamptz not null default now(),
  primary key (boutique_id, id)
);

create table if not exists public.proveedores (
  boutique_id uuid not null default public.auth_boutique_id() references public.boutiques(id) on delete cascade,
  id text not null,
  nombre text not null,
  tipo text,
  contacto text not null default '',
  telefono text not null default '',
  email text,
  direccion text not null default '',
  categorias text[] not null default '{}',
  demora_dias integer,
  condiciones_pago text,
  notas text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (boutique_id, id)
);

-- ---------------------------------------------------------------------------
-- 4. RLS
--    - Todas las cuentas activas de la boutique pueden leer.
--    - movimientos y reservas: cualquier rol puede crear (ventas y señas);
--      solo admin/developer editan o borran movimientos.
--    - reservas: cualquier rol puede marcar retirada; solo admin/developer borran.
--    - promociones y proveedores: solo admin/developer escriben.
-- ---------------------------------------------------------------------------
alter table public.movimientos enable row level security;
alter table public.reservas enable row level security;
alter table public.promociones enable row level security;
alter table public.proveedores enable row level security;

-- movimientos
drop policy if exists movimientos_select on public.movimientos;
drop policy if exists movimientos_insert on public.movimientos;
drop policy if exists movimientos_update on public.movimientos;
drop policy if exists movimientos_delete on public.movimientos;
create policy movimientos_select on public.movimientos for select to authenticated
  using (boutique_id = public.auth_boutique_id());
create policy movimientos_insert on public.movimientos for insert to authenticated
  with check (boutique_id = public.auth_boutique_id());
create policy movimientos_update on public.movimientos for update to authenticated
  using (boutique_id = public.auth_boutique_id() and public.auth_es_gestion())
  with check (boutique_id = public.auth_boutique_id());
create policy movimientos_delete on public.movimientos for delete to authenticated
  using (boutique_id = public.auth_boutique_id() and public.auth_es_gestion());

-- reservas
drop policy if exists reservas_select on public.reservas;
drop policy if exists reservas_insert on public.reservas;
drop policy if exists reservas_update on public.reservas;
drop policy if exists reservas_delete on public.reservas;
create policy reservas_select on public.reservas for select to authenticated
  using (boutique_id = public.auth_boutique_id());
create policy reservas_insert on public.reservas for insert to authenticated
  with check (boutique_id = public.auth_boutique_id());
create policy reservas_update on public.reservas for update to authenticated
  using (boutique_id = public.auth_boutique_id())
  with check (boutique_id = public.auth_boutique_id());
create policy reservas_delete on public.reservas for delete to authenticated
  using (boutique_id = public.auth_boutique_id() and public.auth_es_gestion());

-- promociones
drop policy if exists promociones_select on public.promociones;
drop policy if exists promociones_insert on public.promociones;
drop policy if exists promociones_update on public.promociones;
drop policy if exists promociones_delete on public.promociones;
create policy promociones_select on public.promociones for select to authenticated
  using (boutique_id = public.auth_boutique_id());
create policy promociones_insert on public.promociones for insert to authenticated
  with check (boutique_id = public.auth_boutique_id() and public.auth_es_gestion());
create policy promociones_update on public.promociones for update to authenticated
  using (boutique_id = public.auth_boutique_id() and public.auth_es_gestion())
  with check (boutique_id = public.auth_boutique_id());
create policy promociones_delete on public.promociones for delete to authenticated
  using (boutique_id = public.auth_boutique_id() and public.auth_es_gestion());

-- proveedores
drop policy if exists proveedores_select on public.proveedores;
drop policy if exists proveedores_insert on public.proveedores;
drop policy if exists proveedores_update on public.proveedores;
drop policy if exists proveedores_delete on public.proveedores;
create policy proveedores_select on public.proveedores for select to authenticated
  using (boutique_id = public.auth_boutique_id());
create policy proveedores_insert on public.proveedores for insert to authenticated
  with check (boutique_id = public.auth_boutique_id() and public.auth_es_gestion());
create policy proveedores_update on public.proveedores for update to authenticated
  using (boutique_id = public.auth_boutique_id() and public.auth_es_gestion())
  with check (boutique_id = public.auth_boutique_id());
create policy proveedores_delete on public.proveedores for delete to authenticated
  using (boutique_id = public.auth_boutique_id() and public.auth_es_gestion());

-- ---------------------------------------------------------------------------
-- 5. Gestión de equipo
-- ---------------------------------------------------------------------------
create or replace function public.listar_equipo()
returns table (
  id uuid,
  nombre text,
  apellido text,
  username text,
  email text,
  rol text,
  activo boolean
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.auth_es_gestion() then
    raise exception 'No tenés permisos para ver el equipo.';
  end if;

  return query
    select p.id, p.nombre::text, p.apellido::text, p.username::text, u.email::text, p.rol::text, p.activo
    from public.perfiles p
    left join auth.users u on u.id = p.id
    where p.boutique_id = public.auth_boutique_id()
    order by p.activo desc, p.rol, p.nombre;
end;
$$;

create or replace function public.actualizar_miembro(p_id uuid, p_rol text default null, p_activo boolean default null)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_rol_actual text := public.auth_rol();
  v_objetivo public.perfiles%rowtype;
begin
  if v_rol_actual is null or v_rol_actual not in ('admin', 'developer') then
    raise exception 'No tenés permisos para modificar el equipo.';
  end if;

  if p_id = auth.uid() then
    raise exception 'No podés modificar tu propia cuenta desde acá.';
  end if;

  select * into v_objetivo from public.perfiles where id = p_id;
  if not found or v_objetivo.boutique_id is distinct from public.auth_boutique_id() then
    raise exception 'La cuenta no pertenece a tu boutique.';
  end if;

  if v_objetivo.rol::text = 'developer' and v_rol_actual <> 'developer' then
    raise exception 'Solo un developer puede modificar a otro developer.';
  end if;

  if p_rol is not null then
    if p_rol not in ('admin', 'vendedora', 'developer') then
      raise exception 'Rol inválido.';
    end if;
    if p_rol = 'developer' and v_rol_actual <> 'developer' then
      raise exception 'Solo un developer puede asignar el rol developer.';
    end if;
    -- format/%L: funciona tanto si perfiles.rol es text como si es un enum
    execute format('update public.perfiles set rol = %L where id = %L', p_rol, p_id);
  end if;

  if p_activo is not null then
    update public.perfiles set activo = p_activo where id = p_id;
  end if;
end;
$$;

revoke all on function public.listar_equipo() from public, anon;
revoke all on function public.actualizar_miembro(uuid, text, boolean) from public, anon;
grant execute on function public.listar_equipo() to authenticated;
grant execute on function public.actualizar_miembro(uuid, text, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Descuento de stock por ventas y reservas (cualquier rol activo de la boutique).
--    La vendedora no tiene permiso de escritura directa sobre productos: solo puede
--    descontar unidades a través de esta función. Es atómica (sin pisar ventas simultáneas).
--    p_items: [{"sku": "ABC-1", "cantidad": 2}, ...]
-- ---------------------------------------------------------------------------
create or replace function public.descontar_stock(p_items jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_boutique uuid := public.auth_boutique_id();
  v_item jsonb;
  v_sku text;
  v_cantidad integer;
  v_stock integer;
  v_minimo integer;
  v_status text;
begin
  if v_boutique is null then
    raise exception 'Cuenta sin boutique o desactivada.';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_sku := v_item->>'sku';
    v_cantidad := coalesce((v_item->>'cantidad')::integer, 0);
    if v_sku is null or v_cantidad <= 0 then
      continue;
    end if;

    update public.productos
      set stock = greatest(0, stock - v_cantidad)
      where boutique_id = v_boutique and sku = v_sku
      returning stock, coalesce(min_stock_threshold, 10) into v_stock, v_minimo;

    if found then
      v_status := case when v_stock = 0 then 'agotado' when v_stock <= v_minimo then 'bajo' else 'ok' end;
      -- format/%L: funciona tanto si status es text como si es un enum
      execute format('update public.productos set status = %L where boutique_id = %L and sku = %L', v_status, v_boutique, v_sku);
    end if;
  end loop;
end;
$$;

revoke all on function public.descontar_stock(jsonb) from public, anon;
grant execute on function public.descontar_stock(jsonb) to authenticated;
