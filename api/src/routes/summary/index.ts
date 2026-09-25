import { Router } from "express";
import { pool } from "../../database/db";


const router = Router();


router.get("/", async (_request, response) => {
    try {
        const result = await pool.query(`
            WITH latest_telemetry AS (
                SELECT DISTINCT ON (server_id)
                    server_id,
                    cpu_usage,
                    memory_usage,
                    network_usage_mbps,
                    power_watts,
                    temperature_c
                FROM server_telemetry
                ORDER BY
                    server_id,
                    recorded_at DESC
            )

            SELECT
                COUNT(s.server_id)::INTEGER AS total_servers,

                COUNT(
                    CASE
                        WHEN COALESCE(lt.power_watts, 0) > 0
                        THEN 1
                    END
                )::INTEGER AS online_servers,

                COUNT(
                    CASE
                        WHEN COALESCE(lt.power_watts, 0) = 0
                        THEN 1
                    END
                )::INTEGER AS failed_servers,

                COALESCE(
                    ROUND(
                        AVG(
                            CASE
                                WHEN COALESCE(lt.power_watts, 0) > 0
                                THEN lt.cpu_usage
                            END
                        ),
                        2
                    ),
                    0
                ) AS average_cpu_usage,

                COALESCE(
                    ROUND(
                        AVG(
                            CASE
                                WHEN COALESCE(lt.power_watts, 0) > 0
                                THEN lt.memory_usage
                            END
                        ),
                        2
                    ),
                    0
                ) AS average_memory_usage,

                COALESCE(
                    ROUND(
                        AVG(
                            CASE
                                WHEN COALESCE(lt.power_watts, 0) > 0
                                THEN lt.temperature_c
                            END
                        ),
                        2
                    ),
                    0
                ) AS average_temperature_c,

                COALESCE(
                    ROUND(SUM(lt.network_usage_mbps), 2),
                    0
                ) AS total_network_usage_mbps,

                COALESCE(
                    ROUND(SUM(lt.power_watts), 2),
                    0
                ) AS total_power_watts

            FROM servers s
            LEFT JOIN latest_telemetry lt
                ON s.server_id = lt.server_id;
        `);

        const summary = result.rows[0];

        response.json({
            total_servers: Number(summary.total_servers),
            online_servers: Number(summary.online_servers),
            failed_servers: Number(summary.failed_servers),
            average_cpu_usage: Number(summary.average_cpu_usage),
            average_memory_usage: Number(summary.average_memory_usage),
            average_temperature_c: Number(
                summary.average_temperature_c
            ),
            total_network_usage_mbps: Number(
                summary.total_network_usage_mbps
            ),
            total_power_watts: Number(
                summary.total_power_watts
            )
        });

    } catch (error) {
        console.error(
            "Failed to retrieve data center summary:",
            error
        );

        response.status(500).json({
            error: "Failed to retrieve data center summary."
        });
    }
});


export default router;