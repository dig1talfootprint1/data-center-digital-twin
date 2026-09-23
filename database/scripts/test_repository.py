from database.repository.server_repository import get_server_id


def main():
    server_id = get_server_id("R1-01-S01")

    print(f"Database server ID: {server_id}")


if __name__ == "__main__":
    main()