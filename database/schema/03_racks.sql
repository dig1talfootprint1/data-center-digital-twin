-- ============================================
-- Data Center Digital Twin
-- Table: racks
-- ============================================

CREATE TABLE racks (
    rack_id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,

    CONSTRAINT fk_racks_room
        FOREIGN KEY (room_id)
        REFERENCES rooms(room_id)
);