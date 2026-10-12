-- The schema as Hibernate generated it before Flyway was introduced (UUID string primary keys).
-- Existing databases already have it and are baselined at this version, so this only runs on an empty database.

CREATE TABLE users (
    id         VARCHAR(255) NOT NULL,
    address    VARCHAR(255),
    email      VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name  VARCHAR(255),
    password   VARCHAR(255) NOT NULL,
    phone      VARCHAR(255),
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE TABLE contacts (
    id         VARCHAR(255) NOT NULL,
    address    VARCHAR(255),
    email      VARCHAR(255),
    first_name VARCHAR(255),
    last_name  VARCHAR(255),
    phone      VARCHAR(255),
    user_id    VARCHAR(255) NOT NULL,
    CONSTRAINT contacts_pkey PRIMARY KEY (id),
    CONSTRAINT fk_contacts_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_contacts_user_id ON contacts (user_id);

CREATE TABLE password_reset_otps (
    id                     VARCHAR(255)                NOT NULL,
    created_at             TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    failed_attempts        INTEGER                     NOT NULL,
    otp_expires_at         TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    otp_hash               VARCHAR(255),
    reset_token_expires_at TIMESTAMP(6) WITH TIME ZONE,
    reset_token_hash       VARCHAR(255),
    user_id                VARCHAR(255)                NOT NULL,
    CONSTRAINT password_reset_otps_pkey PRIMARY KEY (id),
    CONSTRAINT uk_password_reset_otps_user UNIQUE (user_id),
    CONSTRAINT fk_password_reset_otps_user FOREIGN KEY (user_id) REFERENCES users (id)
);
