-- Halcyon Events - Gastenlijst
-- Dit script wordt automatisch uitgevoerd bij het opstarten van de database.

CREATE TABLE IF NOT EXISTS guests (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(128) NOT NULL,
    email       VARCHAR(128) NOT NULL,
    ticket_type VARCHAR(32)  NOT NULL DEFAULT 'standard',
    checked_in  BOOLEAN      NOT NULL DEFAULT FALSE
);

INSERT INTO guests (name, email, ticket_type, checked_in) VALUES
    ('Amara Okonkwo',    'amara.okonkwo@example.com',   'vip',      TRUE),
    ('Lars Vandenberghe','lars.v@example.com',          'standard', FALSE),
    ('Sofie Maes',       'sofie.maes@example.com',      'standard', FALSE),
    ('Tobias Lindqvist', 'tobias.l@example.com',        'press',    FALSE),
    ('Neha Raghavan',    'neha.raghavan@example.com',   'vip',      TRUE);
