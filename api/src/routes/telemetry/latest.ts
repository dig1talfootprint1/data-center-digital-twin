import { Router } from "express";
import { pool } from "../../database/db";
import { formatTelemetryRow } from "../../utils/formatTelemetry";


const router = Router();


router.get("/", async (_request, response) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT ON (s.server_id)
                s.server_id,
                s.name AS server_name,
                s.status,
                st.recorded_at,
                st.cpu_usage,
                st.memory_usage,
                st.network_usage_mbps,
                st.power_watts,
                st.temperature_c
            FROM servers s
            LEFT JOIN server_telemetry st
                ON s.server_id = st.server_id
            ORDER BY
                s.server_id,
                st.recorded_at DESC;
        `);

        const telemetry = result.rows.map(formatTelemetryRow);

        response.json(telemetry);

    } catch (error) {
        console.error(
            "Failed to retrieve latest telemetry:",
            error
        );

        response.status(500).json({
            error: "Failed to retrieve latest telemetry."
        });
    }
});


export default router;