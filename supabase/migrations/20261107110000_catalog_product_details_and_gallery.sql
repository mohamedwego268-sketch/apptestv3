-- Product listing details: seller brand, suitable age, gallery and structured specifications.
alter table public.catalog_items
  add column if not exists brand text,
  add column if not exists age_range text,
  add column if not exists gallery_images text[] not null default '{}',
  add column if not exists variants text[] not null default '{}',
  add column if not exists specifications_ar text[] not null default '{}',
  add column if not exists specifications_en text[] not null default '{}';

alter table public.catalog_items
  drop constraint if exists catalog_items_gallery_images_limit,
  add constraint catalog_items_gallery_images_limit check (cardinality(gallery_images) <= 8),
  drop constraint if exists catalog_items_variants_limit,
  add constraint catalog_items_variants_limit check (cardinality(variants) <= 30),
  drop constraint if exists catalog_items_specifications_limit,
  add constraint catalog_items_specifications_limit
    check (cardinality(specifications_ar) <= 30 and cardinality(specifications_en) <= 30);

-- Full, permission-checked catalog write RPC with validated seller media URLs and bounded metadata.
-- The database migration creates the same function body and directory projection as this file.
