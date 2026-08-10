-- ============================================================
-- WHATSGATE — Schema inicial (Sprint 1, multi-tenant desde el dia 1)
-- 4 tablas + RLS por user_id + triggers
-- ============================================================

-- ---------- Extensiones ----------
create extension if not exists "pgcrypto";

-- ---------- Trigger util: updated_at ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ============================================================
-- TABLA: profiles (extiende auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  company text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Crear profile automaticamente al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- TABLA: instances (cada numero de WhatsApp)
-- ============================================================
create table public.instances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  evolution_instance_name text not null unique,
  api_token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  phone_number text,
  profile_name text,
  status text not null default 'disconnected'
    check (status in ('disconnected','connecting','connected','error')),
  webhook_url text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index instances_user_id_idx on public.instances(user_id);
create index instances_api_token_idx on public.instances(api_token);
create index instances_evo_name_idx on public.instances(evolution_instance_name);

alter table public.instances enable row level security;

create policy "instances_select_own" on public.instances
  for select using (auth.uid() = user_id);
create policy "instances_insert_own" on public.instances
  for insert with check (auth.uid() = user_id);
create policy "instances_update_own" on public.instances
  for update using (auth.uid() = user_id);
create policy "instances_delete_own" on public.instances
  for delete using (auth.uid() = user_id);

create trigger instances_updated_at before update on public.instances
  for each row execute function public.set_updated_at();

-- ============================================================
-- TABLA: messages_log (registro de envios -> metricas)
-- ============================================================
create table public.messages_log (
  id uuid primary key default gen_random_uuid(),
  instance_id uuid not null references public.instances(id) on delete cascade,
  evolution_message_id text,
  message_type text not null default 'text'
    check (message_type in ('text','image','document','audio','video','sticker','location','contact')),
  destination_type text not null default 'individual'
    check (destination_type in ('individual','group')),
  destination text not null,
  status text not null default 'PENDING'
    check (status in ('PENDING','DELIVERED','READ','FAILED')),
  content_preview text,
  media_url text,
  file_size bigint,
  mime_type text,
  raw_response jsonb,
  sent_at timestamptz not null default now(),
  delivered_at timestamptz,
  read_at timestamptz
);

create index messages_log_instance_idx on public.messages_log(instance_id);
create index messages_log_sent_at_idx on public.messages_log(sent_at desc);

alter table public.messages_log enable row level security;

-- El usuario ve/inserta mensajes SOLO de sus propias instancias
create policy "messages_select_own" on public.messages_log
  for select using (
    exists (select 1 from public.instances i
            where i.id = messages_log.instance_id and i.user_id = auth.uid())
  );
create policy "messages_insert_own" on public.messages_log
  for insert with check (
    exists (select 1 from public.instances i
            where i.id = messages_log.instance_id and i.user_id = auth.uid())
  );

-- ============================================================
-- TABLA: groups_cache (grupos por instancia)
-- ============================================================
create table public.groups_cache (
  id uuid primary key default gen_random_uuid(),
  instance_id uuid not null references public.instances(id) on delete cascade,
  group_jid text not null,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (instance_id, group_jid)
);

create index groups_cache_instance_idx on public.groups_cache(instance_id);

alter table public.groups_cache enable row level security;

create policy "groups_select_own" on public.groups_cache
  for select using (
    exists (select 1 from public.instances i
            where i.id = groups_cache.instance_id and i.user_id = auth.uid())
  );
create policy "groups_all_own" on public.groups_cache
  for all using (
    exists (select 1 from public.instances i
            where i.id = groups_cache.instance_id and i.user_id = auth.uid())
  );

create trigger groups_cache_updated_at before update on public.groups_cache
  for each row execute function public.set_updated_at();

-- ============================================================
-- GRANTS: permisos base para los roles (RLS sigue aplicando)
-- Sin esto, la Edge Function da "permission denied for table"
-- ============================================================
grant all on all tables in schema public to service_role, anon, authenticated;
grant all on all sequences in schema public to service_role, anon, authenticated;
alter default privileges in schema public grant all on tables to service_role, anon, authenticated;
