from database.connection.db import get_connection


def main():
    connection = get_connection()

    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT
                server_id,
                name,
                status
            FROM servers
            ORDER BY server_id;
        """)

        servers = cursor.fetchall()

    connection.close()

    for server in servers:
        print(server)


if __name__ == "__main__":
    main()