-- Error Logs tablosu oluşturma
create table if not exists public.error_logs (
    id uuid default gen_random_uuid() primary key,
    error_message text,
    error_stack text,
    error_code text,
    path text,
    method text,
    user_id uuid references auth.users(id),
    timestamp timestamptz default now(),
    created_at timestamptz default now()
);

-- İndeksler
create index if not exists idx_error_logs_timestamp on public.error_logs(timestamp);
create index if not exists idx_error_logs_user_id on public.error_logs(user_id);

-- RLS politikaları
alter table public.error_logs enable row level security;

-- Sadece admin rolüne sahip kullanıcılar error logları okuyabilir
create policy "Only admins can read error logs"
on public.error_logs for select
to authenticated
using (
    exists (
        select 1 
        from user_roles ur
        join roles r on r.id = ur.role_id
        where ur.user_id = auth.uid()
        and r.name = 'admin'
    )
);

-- Service role tüm işlemleri yapabilir
create policy "Service role can manage error logs"
on public.error_logs for all
to service_role
using (true)
with check (true);

-- Tetikleyici fonksiyonu
create or replace function public.fn_clean_old_error_logs()
returns trigger as $$
begin
    -- 30 günden eski logları sil
    delete from public.error_logs
    where timestamp < now() - interval '30 days';
    return new;
end;
$$ language plpgsql security definer;

-- Temizleme tetikleyicisi
create trigger tr_clean_old_error_logs
    after insert on public.error_logs
    execute procedure public.fn_clean_old_error_logs();

-- Error log yönetimi için view
create or replace view public.error_log_summary as
select
    date_trunc('day', timestamp) as error_date,
    count(*) as error_count,
    array_agg(distinct error_code) as error_codes,
    count(distinct user_id) as affected_users
from
    public.error_logs
where
    timestamp > now() - interval '7 days'
group by
    date_trunc('day', timestamp)
order by
    error_date desc;

-- View için RLS politikaları kaldırıldı