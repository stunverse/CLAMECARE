-- ----------------------------------------------------------------------------
-- Phone numbers on a case (facilitate human review)
--   debtor_phone : phone of the client/company (the debtor)
--   payer_phone  : phone of the person who must settle the unpaid invoice
-- ----------------------------------------------------------------------------
alter table public.cases
  add column if not exists debtor_phone text,
  add column if not exists payer_phone text;
