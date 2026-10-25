-- Contacts to reach in an emergency, listed on their own Emergency page. Existing contacts start unmarked.
ALTER TABLE contacts ADD COLUMN emergency BOOLEAN NOT NULL DEFAULT FALSE;
