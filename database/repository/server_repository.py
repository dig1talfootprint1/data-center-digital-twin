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
    """Save one telemetry record for a server."""

    connection = get_connection()

    try:
        with connection.cursor() as cursor:

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
                SELECT
                    server_id,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                FROM servers
                WHERE name = %s;
                """,
                (
                    cpu_usage,
                    memory_usage,
                    network_usage_mbps,
                    power_watts,
                    temperature_c,
                    server_name
                )
            )

            if cursor.rowcount == 0:
                raise ValueError(
                    f"Server '{server_name}' was not found."
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