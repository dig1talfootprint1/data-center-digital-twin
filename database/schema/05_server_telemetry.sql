-- ============================================
-- Data Center Digital Twin
-- Table: server_telemetry
-- ============================================

CREATE TABLE server_telemetry (
    telemetry_id BIGSERIAL PRIMARY KEY,
    server_id INTEGER NOT NULL,
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    cpu_usage NUMERIC(5,2) NOT NULL,
    memory_usage NUMERIC(5,2) NOT NULL,
    network_usage_mbps NUMERIC(10,2) NOT NULL,
    power_watts NUMERIC(10,2) NOT NULL,
    temperature_c NUMERIC(5,2) NOT NULL,

    CONSTRAINT fk_telemetry_server
        FOREIGN KEY (server_id)
        REFERENCES servers(server_id),

    CONSTRAINT chk_cpu_usage
        CHECK (cpu_usage >= 0 AND cpu_usage <= 100),

    CONSTRAINT chk_memory_usage
        CHECK (memory_usage >= 0 AND memory_usage <= 100),

    CONSTRAINT chk_network_usage
        CHECK (network_usage_mbps >= 0),

    CONSTRAINT chk_power_watts
        CHECK (power_watts >= 0)
);