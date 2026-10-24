-- Starred contacts, shown at the top of the user's list. Existing contacts start unstarred.
ALTER TABLE contacts ADD COLUMN favorite BOOLEAN NOT NULL DEFAULT FALSE;
