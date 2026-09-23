-- ============================================
-- Data Center Digital Twin
-- Query: Verify Infrastructure
-- ============================================

SELECT
    dc.name AS data_center,
    r.name AS room,
    rk.name AS rack,
    s.name AS server,
    s.status
FROM data_centers dc
JOIN rooms r
    ON r.data_center_id = dc.data_center_id
JOIN racks rk
    ON rk.room_id = r.room_id
JOIN servers s
    ON s.rack_id = rk.rack_id
ORDER BY
    r.name,
    rk.name,
    s.name;