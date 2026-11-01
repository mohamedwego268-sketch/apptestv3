create table if not exists private.platform_b2b_partners (
 id uuid primary key default gen_random_uuid(), partner_code text not null unique, legal_name text not null, display_name text not null,
 partner_type text not null check(partner_type in ('supplier','distributor','retailer','service_provider','corporate_buyer')),
 tax_number text, country text not null default 'SA', city text not null default '', contact_name text, email text, phone text, website text,
 status text not null default 'prospect' check(status in ('prospect','onboarding','active','suspended','archived')),
 currency text not null default 'SAR', payment_terms_days integer not null default 0 check(payment_terms_days between 0 and 365),
 credit_limit numeric(14,2) not null default 0 check(credit_limit>=0), notes text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create sequence if not exists private.platform_b2b_partner_code_seq start 1;
create table if not exists private.platform_b2b_products (
 id uuid primary key default gen_random_uuid(), sku text not null unique,
 partner_id uuid references private.platform_b2b_partners(id) on delete set null,
 name_ar text not null, name_en text not null default '', description text, category text not null default 'general',
 unit text not null default 'piece', min_order_qty numeric(14,3) not null default 1 check(min_order_qty>0),
 cost_price numeric(14,2) not null default 0 check(cost_price>=0), wholesale_price numeric(14,2) not null default 0 check(wholesale_price>=0),
 retail_price numeric(14,2) not null default 0 check(retail_price>=0), currency text not null default 'SAR',
 tax_rate numeric(5,2) not null default 15 check(tax_rate between 0 and 100), stock_qty numeric(14,3),
 country text not null default 'SA', city text, status text not null default 'draft' check(status in ('draft','active','out_of_stock','discontinued')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create sequence if not exists private.platform_b2b_sku_seq start 1;
create table if not exists private.platform_b2b_orders (
 id uuid primary key default gen_random_uuid(), order_no text not null unique,
 buyer_partner_id uuid not null references private.platform_b2b_partners(id),
 status text not null default 'inquiry' check(status in ('inquiry','quote_sent','approved','processing','shipped','delivered','cancelled')),
 currency text not null default 'SAR', subtotal numeric(14,2) not null default 0, tax_total numeric(14,2) not null default 0,
 total numeric(14,2) not null default 0, requested_delivery_date date, notes text,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create sequence if not exists private.platform_b2b_order_seq start 1;
create table if not exists private.platform_b2b_order_items (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references private.platform_b2b_orders(id) on delete cascade,
 product_id uuid references private.platform_b2b_products(id) on delete set null, description text not null,
 quantity numeric(14,3) not null check(quantity>0), unit_price numeric(14,2) not null check(unit_price>=0),
 tax_rate numeric(5,2) not null default 15 check(tax_rate between 0 and 100), line_total numeric(14,2) not null check(line_total>=0),
 created_at timestamptz not null default now()
);
create table if not exists private.platform_b2b_quotes (
 id uuid primary key default gen_random_uuid(), quote_no text not null unique,
 order_id uuid not null references private.platform_b2b_orders(id) on delete cascade,
 status text not null default 'draft' check(status in ('draft','sent','accepted','rejected','expired')),
 valid_until date, subtotal numeric(14,2) not null default 0, tax_total numeric(14,2) not null default 0,
 total numeric(14,2) not null default 0, terms text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists private.platform_b2b_invoices (
 id uuid primary key default gen_random_uuid(), invoice_no text not null unique,
 order_id uuid not null references private.platform_b2b_orders(id) on delete restrict,
 status text not null default 'draft' check(status in ('draft','issued','partially_paid','paid','overdue','void')),
 currency text not null default 'SAR', total numeric(14,2) not null default 0,
 amount_paid numeric(14,2) not null default 0 check(amount_paid>=0), due_date date, issued_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(amount_paid<=total)
);
create index if not exists platform_b2b_partners_status_idx on private.platform_b2b_partners(status,partner_type);
create index if not exists platform_b2b_products_partner_status_idx on private.platform_b2b_products(partner_id,status);
create index if not exists platform_b2b_orders_buyer_created_idx on private.platform_b2b_orders(buyer_partner_id,created_at desc);
create index if not exists platform_b2b_orders_status_created_idx on private.platform_b2b_orders(status,created_at desc);
create index if not exists platform_b2b_order_items_order_idx on private.platform_b2b_order_items(order_id);
create index if not exists platform_b2b_quotes_order_idx on private.platform_b2b_quotes(order_id,status);
create index if not exists platform_b2b_invoices_order_idx on private.platform_b2b_invoices(order_id,status);
revoke all on all tables in schema private from public,anon,authenticated;
revoke all on all sequences in schema private from public,anon,authenticated;
