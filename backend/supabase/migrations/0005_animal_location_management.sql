-- Test grupları için enum
do $$ begin
    create type animal_test_group as enum ('TEMIZ', 'SUSPECT', 'IZOLE');
exception
    when duplicate_object then null;
end $$;

-- Lokasyon tipleri için enum (Bu enum artık doğrudan animals veya history tablolarında kullanılmayacak,
-- ancak lokasyon tiplerini belirtmek için locations tablosunda kullanılabilir)
do $$ begin
    create type animal_location_type as enum (
        'TEMIZ_BOLGE',
        'IZOLASYON_BOLGE',
        'KARANTINA_BOLGE',
        'MEVCUT_CIFTLIK'
    );
exception
    when duplicate_object then null;
end $$;

-- Animal Location History tablosu (location kolonları text olarak kalacak)
create table if not exists public.animal_location_history (
    id uuid default gen_random_uuid() primary key,
    animal_id uuid references public.animals(id) on delete cascade,
    previous_location text not null, -- Önceki lokasyon adı veya ID'si (text)
    new_location text not null,     -- Yeni lokasyon adı veya ID'si (text)
    change_reason text,
    change_date timestamptz default now(),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Location History için indeksler
create index if not exists idx_alh_animal_id on public.animal_location_history(animal_id);
create index if not exists idx_alh_change_date on public.animal_location_history(change_date);

-- Animals tablosuna test_group kolonu ekleme ve enum tipine çevirme
alter table public.animals add column if not exists test_group animal_test_group;

-- RLS politikaları (animal_location_history için)
alter table public.animal_location_history enable row level security;

create policy "Authenticated users can read animal location history"
on public.animal_location_history for select
to authenticated
using (true);

create policy "Service role can manage animal location history"
on public.animal_location_history for all
to service_role
using (true)
with check (true);

-- Location History için function ve trigger (updated_at güncellemesi)
create or replace function public.fn_update_animal_location_history_timestamp()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql security definer;

create trigger tr_animal_location_history_timestamp
    before update on public.animal_location_history
    for each row
    execute procedure public.fn_update_animal_location_history_timestamp();


-- Rapor için view oluşturma (animals.location yerine animals.current_location_id kullanılacak,
-- ancak view'da lokasyon adını göstermek için locations tablosu ile join yapmak daha iyi olur)
-- Önceki view'ı sil (varsa)
drop view if exists public.animal_test_location_summary;

-- Yeni view oluşturma
create or replace view public.animal_test_location_summary as
select
    a.test_group,
    l.name as location_name,
    l.type as location_type,
    count(a.id) as animal_count,
    array_agg(distinct a.category) as categories
from
    public.animals a
left join
    public.locations l on a.current_location_id = l.id
group by
    a.test_group,
    l.name,
    l.type;

-- View için RLS politikaları kaldırıldı