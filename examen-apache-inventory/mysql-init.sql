-- Northwind Hardware - Warehouse Inventory
-- Dit script wordt automatisch uitgevoerd bij het opstarten van de database.

CREATE TABLE IF NOT EXISTS parts (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    sku      VARCHAR(32)  NOT NULL,
    name     VARCHAR(128) NOT NULL,
    location VARCHAR(32)  NOT NULL,
    quantity INT          NOT NULL DEFAULT 0
);

INSERT INTO parts (sku, name, location, quantity) VALUES
    ('NH-1001', 'Zeskantbout M8 x 40mm',        'A-01-3', 1420),
    ('NH-1002', 'Sluitring M8 verzinkt',        'A-01-4', 3980),
    ('NH-2050', 'Kogellager 6204-2RS',          'B-04-1',  212),
    ('NH-3100', 'PVC buis 32mm (2m)',           'C-02-2',   64),
    ('NH-4007', 'Werkhandschoenen maat L',      'D-01-1',  138),
    ('NH-4402', 'Schuurschijf 125mm korrel 80', 'D-03-5',  510);
