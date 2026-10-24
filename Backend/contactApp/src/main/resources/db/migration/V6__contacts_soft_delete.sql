-- Deleting a contact first only hides it, so the user can undo. Rows are removed for good once deleted_at is
-- older than the undo grace period (see ContactService.purgeDeletedContacts). NULL means not deleted.
ALTER TABLE contacts ADD COLUMN deleted_at TIMESTAMP(6) WITH TIME ZONE;
CREATE INDEX idx_contacts_deleted_at ON contacts (deleted_at) WHERE deleted_at IS NOT NULL;
