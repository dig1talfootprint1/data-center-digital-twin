-- ============================================
-- Data Center Digital Twin
-- Table: servers
-- ============================================

CREATE TABLE servers (
    server_id SERIAL PRIMARY KEY,
    rack_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Online',

    CONSTRAINT fk_servers_rack
        FOREIGN KEY (rack_id)
        REFERENCES racks(rack_id)
);