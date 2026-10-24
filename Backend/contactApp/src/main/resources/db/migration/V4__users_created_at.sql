-- When each account was created, for the "Member since" badge on the profile.
-- Existing accounts stay NULL: their real sign-up date is unknown, and the badge is simply hidden for them.
ALTER TABLE users ADD COLUMN created_at TIMESTAMP(6) WITH TIME ZONE;
ALTER TABLE users ALTER COLUMN created_at SET DEFAULT now();
