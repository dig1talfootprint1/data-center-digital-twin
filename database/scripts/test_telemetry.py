from database.repository.server_repository import save_telemetry


def main():
    save_telemetry(
        server_name="R1-01-S01",
        cpu_usage=47.2,
        memory_usage=63.1,
        network_usage_mbps=218.4,
        power_watts=367.9,
        temperature_c=24.8
    )

    print("Telemetry saved successfully.")


if __name__ == "__main__":
    main()