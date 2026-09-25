import { Router } from "express";
import { pool } from "../database/db";


const router = Router();


router.get("/", async (_request, response) => {

    try {

        const result = await pool.query(`
            SELECT
                a.alert_id,
                a.server_id,
                s.name AS server_name,
                a.created_at,
                a.alert_type,
                a.severity,
                a.message,
                a.resolved,
                a.resolved_at
            FROM alerts a
            LEFT JOIN servers s
                ON a.server_id = s.server_id
            WHERE a.resolved = FALSE
            ORDER BY
                a.created_at DESC;
        `);


        response.json(result.rows);

    } catch (error) {

        console.error(
            "Failed to retrieve alerts:",
            error
        );


        response.status(500).json({
            error: "Failed to retrieve alerts."
        });
    }
});


export default router;