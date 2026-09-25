import { Router } from "express";
import { pool } from "../database/db";
import { formatTelemetryRow } from "../utils/formatTelemetry";


const router = Router();


router.get("/", async (_request, response) => {
    try {
        const result = await pool.query(`
            SELECT
                s.server_id,
                s.name AS server_name,
                s.status,
                rk.name AS rack_name,
                r.name AS room_name,
                dc.name AS data_center_name
            FROM servers s
            JOIN racks rk
                ON s.rack_id = rk.rack_id
            JOIN rooms r
                ON rk.room_id = r.room_id
            JOIN data_centers dc
                ON r.data_center_id = dc.data_center_id
            ORDER BY s.server_id;
        `);

        response.json(result.rows);

    } catch (error) {
        console.error("Failed to retrieve servers:", error);

        response.status(500).json({
            error: "Failed to retrieve servers."
        });
    }
});


router.get("/:id/telemetry", async (request, response) => {
    try {
        const serverId = Number(request.params.id);

        if (!Number.isInteger(serverId)) {
            response.status(400).json({
                error: "Server ID must be an integer."
            });
            return;
        }

        const result = await pool.query(
            `
            SELECT
                telemetry_id,
                server_id,
                recorded_at,
                cpu_usage,
                memory_usage,
                network_usage_mbps,
                power_watts,
                temperature_c
            FROM server_telemetry
            WHERE server_id = $1
            ORDER BY recorded_at ASC;
            `,
            [serverId]
        );

        const telemetry = result.rows.map(formatTelemetryRow);

        response.json(telemetry);

    } catch (error) {
        console.error("Failed to retrieve server telemetry:", error);

        response.status(500).json({
            error: "Failed to retrieve server telemetry."
        });
    }
});


router.get("/:id", async (request, response) => {
    try {
        const serverId = Number(request.params.id);

        if (!Number.isInteger(serverId)) {
            response.status(400).json({
                error: "Server ID must be an integer."
            });
            return;
        }

        const result = await pool.query(
            `
            SELECT
                s.server_id,
                s.name AS server_name,
                s.status,
                rk.name AS rack_name,
                r.name AS room_name,
                dc.name AS data_center_name
            FROM servers s
            JOIN racks rk
                ON s.rack_id = rk.rack_id
            JOIN rooms r
                ON rk.room_id = r.room_id
            JOIN data_centers dc
                ON r.data_center_id = dc.data_center_id
            WHERE s.server_id = $1;
            `,
            [serverId]
        );

        if (result.rows.length === 0) {
            response.status(404).json({
                error: "Server not found."
            });
            return;
        }

        response.json(result.rows[0]);

    } catch (error) {
        console.error("Failed to retrieve server:", error);

        response.status(500).json({
            error: "Failed to retrieve server."
        });
    }
});


export default router;