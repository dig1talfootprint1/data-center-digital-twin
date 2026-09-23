from database.connection.db import get_connection


def main():
    connection = get_connection()

    print("Successfully connected to PostgreSQL.")

    connection.close()


if __name__ == "__main__":
    main()

