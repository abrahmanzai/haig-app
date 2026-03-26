-- Remove all placeholder seed data from the live database.
-- Run this once in the Supabase SQL editor if you previously ran seed.sql.

DELETE FROM trades;
DELETE FROM holdings;

UPDATE club_financials
SET cash_on_hand   = 0,
    total_invested = 0,
    updated_at     = NOW()
WHERE id = 1;
