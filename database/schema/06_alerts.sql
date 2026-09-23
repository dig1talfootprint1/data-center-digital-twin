-- ============================================
-- Data Center Digital Twin
-- Table: alerts
-- ============================================

CREATE TABLE alerts (
    alert_id BIGSERIAL PRIMARY KEY,
    server_id INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,

    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_at TIMESTAMP,

    CONSTRAINT fk_alerts_server
        FOREIGN KEY (server_id)
        REFERENCES servers(server_id),

    CONSTRAINT chk_alert_severity
        CHECK (severity IN ('Info', 'Warning', 'Critical'))
);