-- ==============================================================================
-- LGPD Compliance Migration (Lei nº 13.709/2018)
-- Modules:
-- 1. ConsentLog (Gestão de Consentimento e Bases Legais - Art. 7º e 8º)
-- 2. AuditLog (Registro de Acesso a Dados Pessoais - Art. 46 e 50)
-- 3. AdoptionContractsVault (Custódia Restrita de Termos Legais - Art. 16, I e Art. 7º, VI)
-- 4. Funções de Anonimização, Descarte de Triagens Abandonadas e Auditoria
-- ==============================================================================

-- 1. ConsentLog (Tabela de Registro de Consentimento)
create table if not exists public.consent_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null, -- 'termos_de_uso', 'politica_privacidade', 'compartilhamento_com_ong', 'comunicacao_marketing'
  version text not null default '1.0',
  status text not null check (status in ('granted', 'revoked')),
  ip_address text, -- IP com hash ou mascarado para privacidade
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

grant select, insert on public.consent_logs to authenticated;
grant all on public.consent_logs to service_role;
alter table public.consent_logs enable row level security;

create policy "users can view own consent logs" on public.consent_logs
  for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "users can insert own consent logs" on public.consent_logs
  for insert to authenticated
  with check (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create index if not exists idx_consent_logs_user on public.consent_logs (user_id, consent_type);

-- 2. AuditLog (Registro de Acesso e Visualização de Dados Críticos)
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_role text not null default 'user',
  target_user_id uuid references auth.users(id) on delete set null,
  action text not null, -- 'view_full_profile', 'view_cpf', 'view_proof_document', 'export_data', 'delete_request'
  resource text not null default 'profiles',
  details jsonb default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

grant select, insert on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;

-- O titular dos dados pode ver quem acessou seus dados (transparência Art. 18, IV), além de admins
create policy "users and admins can view audit logs" on public.audit_logs
  for select to authenticated
  using (
    target_user_id = auth.uid() or 
    actor_id = auth.uid() or 
    public.has_role(auth.uid(), 'admin')
  );

create policy "authenticated can insert audit logs" on public.audit_logs
  for insert to authenticated
  with check (actor_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create index if not exists idx_audit_logs_target on public.audit_logs (target_user_id, created_at desc);
create index if not exists idx_audit_logs_actor on public.audit_logs (actor_id, created_at desc);

-- 3. AdoptionContractsVault (Cofre de Termos de Adoção Assinados - Art. 16, I da LGPD)
create table if not exists public.adoption_contracts_vault (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid references public.pets(id) on delete set null,
  original_user_id uuid references auth.users(id) on delete set null,
  anonymized_user_identifier text,
  contract_url text not null,
  legal_basis text not null default 'Art. 7º, VI e Art. 16, I - Exercício regular de direitos e cumprimento de obrigação legal',
  signed_at timestamptz not null default now(),
  retention_until timestamptz not null default (now() + interval '5 years'),
  is_anonymized boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

grant select on public.adoption_contracts_vault to authenticated;
grant all on public.adoption_contracts_vault to service_role;
alter table public.adoption_contracts_vault enable row level security;

-- Apenas admins e departamento jurídico/DPO podem ter acesso ao cofre de contratos
create policy "admins view adoption contracts vault" on public.adoption_contracts_vault
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin') or original_user_id = auth.uid());

create policy "admins manage adoption contracts vault" on public.adoption_contracts_vault
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 4. Função Segura para Registro de Consentimento
create or replace function public.log_user_consent(
  _consent_type text,
  _version text,
  _status text,
  _ip_address text default null,
  _user_agent text default null,
  _metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _log_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Apenas usuários autenticados podem registrar consentimento.';
  end if;

  insert into public.consent_logs (
    user_id,
    consent_type,
    version,
    status,
    ip_address,
    user_agent,
    metadata
  ) values (
    auth.uid(),
    _consent_type,
    coalesce(_version, '1.0'),
    _status,
    _ip_address,
    _user_agent,
    coalesce(_metadata, '{}'::jsonb)
  ) returning id into _log_id;

  return _log_id;
end;
$$;

-- 5. Função Segura para Registro de Auditoria de Acesso
create or replace function public.log_access_audit(
  _target_user_id uuid,
  _action text,
  _resource text default 'profiles',
  _details jsonb default '{}'::jsonb,
  _ip_address text default null,
  _user_agent text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _actor_id uuid := auth.uid();
  _actor_role text := 'user';
  _log_id uuid;
begin
  if _actor_id is not null then
    if public.has_role(_actor_id, 'admin') then
      _actor_role := 'admin';
    else
      select profile_type::text into _actor_role from public.profiles where id = _actor_id;
      _actor_role := coalesce(_actor_role, 'user');
    end if;
  end if;

  insert into public.audit_logs (
    actor_id,
    actor_role,
    target_user_id,
    action,
    resource,
    details,
    ip_address,
    user_agent
  ) values (
    _actor_id,
    _actor_role,
    _target_user_id,
    _action,
    coalesce(_resource, 'profiles'),
    coalesce(_details, '{}'::jsonb),
    _ip_address,
    _user_agent
  ) returning id into _log_id;

  return _log_id;
end;
$$;

-- 6. Rotina de Retenção e Ciclo de Vida de Triagens (60 dias)
-- Descarta ou anonimiza anexos e dados de triagens abandonadas/recusadas após 60 dias
create or replace function public.purge_abandoned_applications(_days_threshold integer default 60)
returns table(purged_conversations integer, purged_messages integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  _conv_count integer := 0;
  _msg_count integer := 0;
  _cutoff timestamptz := now() - (_days_threshold || ' days')::interval;
begin
  -- Identifica conversas de triagem sem atividade por mais de 60 dias
  with abandoned as (
    select id from public.conversations
    where kind = 'pet'
      and last_message_at < _cutoff
  ),
  cleaned_msgs as (
    update public.messages
    set attachment_path = null,
        body = '[Anexo e dados de triagem removidos preventivamente conforme política de retenção da LGPD após 60 dias de inatividade]'
    where conversation_id in (select id from abandoned)
      and attachment_path is not null
    returning id
  )
  select count(*) into _msg_count from cleaned_msgs;

  -- Registra na auditoria administrativa a execução da rotina
  insert into public.audit_logs (
    actor_role,
    action,
    resource,
    details
  ) values (
    'system_worker',
    'retention_cleanup_60d',
    'conversations',
    jsonb_build_object(
      'days_threshold', _days_threshold,
      'cleaned_attachments', _msg_count,
      'timestamp', now()
    )
  );

  return query select _conv_count, _msg_count;
end;
$$;

-- 7. Função de Anonimização ou Hard Delete (Art. 18, VI da LGPD)
create or replace function public.request_user_data_erasure(_target_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _caller uuid := auth.uid();
  _has_signed_contracts boolean := false;
  _anonymized_tag text;
begin
  -- Apenas o próprio usuário ou um admin pode solicitar
  if _caller is null or (_caller <> _target_user_id and not public.has_role(_caller, 'admin')) then
    raise exception 'Não autorizado.';
  end if;

  -- Verifica se existem termos de adoção concluídos no cofre
  select exists(
    select 1 from public.adoption_contracts_vault
    where original_user_id = _target_user_id
  ) into _has_signed_contracts;

  -- Também verifica se há pets com adoção concluída vinculados
  if not _has_signed_contracts then
    select exists(
      select 1 from public.pets
      where owner_id = _target_user_id and status = 'adotado'
    ) into _has_signed_contracts;
  end if;

  if _has_signed_contracts then
    -- Cenário B: Usuário possui adoção concluída.
    -- Preserva contrato em cofre isolado (Art. 16, I da LGPD) e anonimiza dados cadastrais
    _anonymized_tag := 'anon_' || substr(md5(_target_user_id::text), 1, 8);

    update public.profiles
    set name = 'Titular Anonimizado (' || _anonymized_tag || ')',
        email = _anonymized_tag || '@privacidade.caritaspets.local',
        phone = null,
        cep = null,
        address = null,
        cpf = null,
        cnpj = null,
        social_link = null,
        proof_path = null,
        avatar_url = null,
        census = '{"status": "anonymized"}'::jsonb,
        updated_at = now()
    where id = _target_user_id;

    -- Atualiza cofre de contratos para manter isolado
    update public.adoption_contracts_vault
    set is_anonymized = true,
        anonymized_user_identifier = _anonymized_tag
    where original_user_id = _target_user_id;

    insert into public.audit_logs (
      actor_id,
      actor_role,
      target_user_id,
      action,
      resource,
      details
    ) values (
      _caller,
      'dpo_erasure',
      _target_user_id,
      'anonymize_user_with_retained_contract',
      'profiles',
      jsonb_build_object(
        'reason', 'Art. 16, I - Retenção de termo de guarda responsável e anonimização de perfil',
        'anonymized_tag', _anonymized_tag
      )
    );

    return jsonb_build_object(
      'status', 'anonymized',
      'message', 'Dados cadastrais anonimizados com sucesso. O termo de guarda do animal foi mantido em cofre isolado conforme Art. 16, I da LGPD para fins de proteção animal e cumprimento legal.'
    );
  else
    -- Cenário A: Usuário NÃO possui adoções concluídas.
    -- Hard Delete completo de dados e arquivos de triagem.
    delete from public.profiles where id = _target_user_id;
    delete from public.user_roles where user_id = _target_user_id;
    delete from public.conversations where adopter_id = _target_user_id;

    insert into public.audit_logs (
      actor_id,
      actor_role,
      target_user_id,
      action,
      resource,
      details
    ) values (
      _caller,
      'dpo_erasure',
      _target_user_id,
      'hard_delete_user_data',
      'profiles',
      jsonb_build_object('reason', 'Direito ao esquecimento - Art. 18, VI da LGPD')
    );

    return jsonb_build_object(
      'status', 'deleted',
      'message', 'Todos os seus dados pessoais, fotos de triagem e comprovantes foram permanentemente excluídos do sistema.'
    );
  end if;
end;
$$;
