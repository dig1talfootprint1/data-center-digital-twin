from database.repository.server_repository import save_server_telemetry


def main():
    telemetry = {
        "server_id": "R1-01-S02",
        "cpu_usage": 52.4,
        "memory_usage": 61.7,
        "network_usage": 241.8,
        "power_watts": 381.5,
        "temperature_c": 25.6
    }

    save_server_telemetry(telemetry)

    print("Server telemetry saved successfully.")


if __name__ == "__main__":
    main()