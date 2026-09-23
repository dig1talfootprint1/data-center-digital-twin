-- ============================================
-- Data Center Digital Twin
-- Table: data_centers
-- ============================================

CREATE TABLE data_centers (
    data_center_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);