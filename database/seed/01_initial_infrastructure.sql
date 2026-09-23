-- ============================================
-- Data Center Digital Twin
-- Seed: Initial Infrastructure
-- ============================================

-- Create the data center
INSERT INTO data_centers (name, location)
VALUES ('DC-01', 'Simulated Facility');


-- Create the room
INSERT INTO rooms (data_center_id, name)
VALUES (1, 'Room-01');


-- Create the racks
INSERT INTO racks (room_id, name)
VALUES
    (1, 'R1-01'),
    (1, 'R1-02');


-- Create the servers
INSERT INTO servers (rack_id, name, status)
VALUES
    (1, 'R1-01-S01', 'Online'),
    (1, 'R1-01-S02', 'Online'),
    (1, 'R1-01-S03', 'Online'),
    (2, 'R1-02-S01', 'Online'),
    (2, 'R1-02-S02', 'Online'),
    (2, 'R1-02-S03', 'Online');