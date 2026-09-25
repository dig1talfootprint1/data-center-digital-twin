import { pool } from "./db";


async function main() {
    try {
        const result = await pool.query(
            "SELECT NOW() AS current_time;"
        );

        console.log("Successfully connected to PostgreSQL.");
        console.log(
            "Database time:",
            result.rows[0].current_time
        );

    } catch (error) {
        console.error("Database connection failed.");
        console.error(error);

    } finally {
        await pool.end();
    }
}


main();