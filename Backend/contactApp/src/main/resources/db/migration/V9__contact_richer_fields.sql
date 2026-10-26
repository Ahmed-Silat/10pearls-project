-- Richer contact fields: company, birthday and notes on the contact, plus extra phone numbers and emails.
-- The existing contacts.phone and contacts.email stay as the contact's main number and email (used on the cards
-- and by the duplicate check); the tables below hold any others, each with a label such as "work" or "home".

ALTER TABLE contacts ADD COLUMN company  VARCHAR(100);
ALTER TABLE contacts ADD COLUMN birthday DATE;
ALTER TABLE contacts ADD COLUMN notes    VARCHAR(2000);

-- "position" keeps the order the user entered them in. Deleting a contact for good removes its rows here.
CREATE TABLE contact_phones (
    contact_id BIGINT      NOT NULL,
    position   INTEGER     NOT NULL,
    label      VARCHAR(20) NOT NULL,
    value      VARCHAR(20) NOT NULL,
    CONSTRAINT pk_contact_phones PRIMARY KEY (contact_id, position),
    CONSTRAINT fk_contact_phones_contact FOREIGN KEY (contact_id) REFERENCES contacts (contact_id) ON DELETE CASCADE
);

CREATE TABLE contact_emails (
    contact_id BIGINT       NOT NULL,
    position   INTEGER      NOT NULL,
    label      VARCHAR(20)  NOT NULL,
    value      VARCHAR(100) NOT NULL,
    CONSTRAINT pk_contact_emails PRIMARY KEY (contact_id, position),
    CONSTRAINT fk_contact_emails_contact FOREIGN KEY (contact_id) REFERENCES contacts (contact_id) ON DELETE CASCADE
);
