-- ============================================
-- Data Center Digital Twin
-- Table: rooms
-- ============================================

CREATE TABLE rooms (
    room_id SERIAL PRIMARY KEY,
    data_center_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,

    CONSTRAINT fk_rooms_data_center
        FOREIGN KEY (data_center_id)
        REFERENCES data_centers(data_center_id)
);