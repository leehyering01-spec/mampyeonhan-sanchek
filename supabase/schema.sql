-- Mission 6: walk review CRUD. No auth / RLS (Mission 7).
create table if not exists public.walk_reviews (
  id uuid primary key default gen_random_uuid(),
  destination_id text not null,
  destination_name text not null,
  nickname text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  body text not null,
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists walk_reviews_created_at_idx
  on public.walk_reviews (created_at desc);

create index if not exists walk_reviews_rating_idx
  on public.walk_reviews (rating desc, created_at desc);

alter table public.walk_reviews disable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists walk_reviews_set_updated_at on public.walk_reviews;
create trigger walk_reviews_set_updated_at
before update on public.walk_reviews
for each row
execute function public.set_updated_at();

insert into storage.buckets (id, name, public)
values ('review-photos', 'review-photos', true)
on conflict (id) do nothing;

drop policy if exists "review photos public read" on storage.objects;
drop policy if exists "review photos public insert" on storage.objects;
drop policy if exists "review photos public update" on storage.objects;
drop policy if exists "review photos public delete" on storage.objects;

create policy "review photos public read"
on storage.objects for select
using (bucket_id = 'review-photos');

create policy "review photos public insert"
on storage.objects for insert
with check (bucket_id = 'review-photos');

create policy "review photos public update"
on storage.objects for update
using (bucket_id = 'review-photos');

create policy "review photos public delete"
on storage.objects for delete
using (bucket_id = 'review-photos');
