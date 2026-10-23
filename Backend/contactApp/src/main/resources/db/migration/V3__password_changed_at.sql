-- When the user last changed or reset their password. Login tokens issued before this moment are rejected,
-- so changing the password signs out every other session. NULL means the password has never been changed.
ALTER TABLE users ADD COLUMN password_changed_at TIMESTAMP(6) WITH TIME ZONE;
