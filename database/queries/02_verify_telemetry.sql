-- ============================================
-- Data Center Digital Twin
-- Query: Verify Server Telemetry
-- ============================================

SELECT
    st.telemetry_id,
    s.name AS server,
    st.recorded_at,
    st.cpu_usage,
    st.memory_usage,
    st.network_usage_mbps,
    st.power_watts,
    st.temperature_c
FROM server_telemetry st
JOIN servers s
    ON s.server_id = st.server_id
ORDER BY st.recorded_at DESC;

SELECT
    st.telemetry_id,
    s.name AS server,
    st.recorded_at,
    st.cpu_usage,
    st.memory_usage,
    st.network_usage_mbps,
    st.power_watts,
    st.temperature_c
FROM server_telemetry st
JOIN servers s
    ON s.server_id = st.server_id
ORDER BY st.recorded_at DESC;