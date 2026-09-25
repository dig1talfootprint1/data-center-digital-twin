from database.connection.db import get_connection


def get_server_id(server_name):
    """Return the database ID for a server name."""

    connection = get_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT server_id
                FROM servers
                WHERE name = %s;
                """,
                (server_name,)
            )

            result = cursor.fetchone()

            if result is None:
                raise ValueError(
                    f"Server '{server_name}' was not found."
                )

            return result[0]

    finally:
        connection.close()


def save_telemetry(
    server_name,
    cpu_usage,
    memory_usage,
    network_usage_mbps,
    power_watts,
    temperature_c
):
    """Save telemetry and update the server's operational status."""

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT server_id
                FROM servers
                WHERE name = %s;
                """,
                (server_name,)
            )

            result = cursor.fetchone()

            if result is None:
                raise ValueError(
                    f"Server '{server_name}' was not found."
                )

            server_id = result[0]

            cursor.execute(
                """
                INSERT INTO server_telemetry (
                    server_id,
                    cpu_usage,
                    memory_usage,
                    network_usage_mbps,
                    power_watts,
                    temperature_c
                )
                VALUES (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                );
                """,
                (
                    server_id,
                    cpu_usage,
                    memory_usage,
                    network_usage_mbps,
                    power_watts,
                    temperature_c
                )
            )

            status = (
                "Failed"
                if power_watts == 0
                else "Online"
            )

            cursor.execute(
                """
                UPDATE servers
                SET status = %s
                WHERE server_id = %s;
                """,
                (
                    status,
                    server_id
                )
            )

            if status == "Failed":

                cursor.execute(
                    """
                    SELECT alert_id
                    FROM alerts
                    WHERE server_id = %s
                      AND alert_type = 'Server Failure'
                      AND resolved = FALSE
                    LIMIT 1;
                    """,
                    (server_id,)
                )

                active_alert = cursor.fetchone()

                if active_alert is None:

                    cursor.execute(
                        """
                        INSERT INTO alerts (
                            server_id,
                            alert_type,
                            severity,
                            message,
                            resolved
                        )
                        VALUES (
                            %s,
                            'Server Failure',
                            'Critical',
                            %s,
                            FALSE
                        );
                        """,
                        (
                            server_id,
                            f"Server {server_name} has failed."
                        )
                    )

            else:

                cursor.execute(
                    """
                    UPDATE alerts
                    SET
                        resolved = TRUE,
                        resolved_at = CURRENT_TIMESTAMP
                    WHERE server_id = %s
                      AND alert_type = 'Server Failure'
                      AND resolved = FALSE;
                    """,
                    (server_id,)
                )

        connection.commit()

    finally:
        connection.close()


def save_server_telemetry(telemetry):
    """Save a server telemetry dictionary to PostgreSQL."""

    save_telemetry(
        server_name=telemetry["server_id"],
        cpu_usage=telemetry["cpu_usage"],
        memory_usage=telemetry["memory_usage"],
        network_usage_mbps=telemetry["network_usage"],
        power_watts=telemetry["power_watts"],
        temperature_c=telemetry["temperature_c"]
    )