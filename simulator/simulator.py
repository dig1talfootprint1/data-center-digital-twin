import random
import time

from database.repository.server_repository import save_server_telemetry


NUM_ROOMS = 1
RACKS_PER_ROOM = 2
SERVERS_PER_RACK = 3


class Server:
    def __init__(self, server_id, rack_id):
        self.server_id = server_id
        self.rack_id = rack_id

        self.cpu_usage = random.uniform(20, 60)
        self.memory_usage = random.uniform(30, 70)
        self.network_usage = random.uniform(100, 300)

        self.power_watts = 0
        self.temperature_c = 22.0

        self.status = "Online"

    def generate_telemetry(self):
        if self.status == "Offline":
            self.cpu_usage = 0
            self.memory_usage = 0
            self.network_usage = 0
            self.power_watts = 0
            self.temperature_c = 0

            return

        self.cpu_usage = max(
            5,
            min(100, self.cpu_usage + random.uniform(-8, 8))
        )

        self.memory_usage = max(
            10,
            min(95, self.memory_usage + random.uniform(-3, 3))
        )

        self.network_usage = max(
            0,
            self.network_usage + random.uniform(-40, 40)
        )

        base_power = 150
        cpu_factor = self.cpu_usage / 100

        self.power_watts = base_power + (cpu_factor * 250)

        target_temperature = 22 + (
            (self.power_watts - 250) / 100
        )

        self.temperature_c += (
            (target_temperature - self.temperature_c) * 0.15
        )

        self.temperature_c += random.uniform(-0.2, 0.2)

        if self.cpu_usage > 95:
            self.status = "High Load"
        else:
            self.status = "Online"

    def fail(self):
        self.status = "Offline"

    def get_telemetry(self):
        return {
            "server_id": self.server_id,
            "rack_id": self.rack_id,
            "cpu_usage": round(self.cpu_usage, 2),
            "memory_usage": round(self.memory_usage, 2),
            "network_usage": round(self.network_usage, 2),
            "power_watts": round(self.power_watts, 2),
            "temperature_c": round(self.temperature_c, 2),
            "status": self.status
        }


class Rack:
    def __init__(self, rack_id, server_count):
        self.rack_id = rack_id

        self.servers = [
            Server(
                server_id=f"{rack_id}-S{i + 1:02d}",
                rack_id=rack_id
            )
            for i in range(server_count)
        ]

    def generate_telemetry(self):
        for server in self.servers:
            server.generate_telemetry()

    def get_telemetry(self):
        active_servers = [
            server
            for server in self.servers
            if server.status != "Offline"
        ]

        failed_servers = [
            server
            for server in self.servers
            if server.status == "Offline"
        ]

        if active_servers:
            average_temperature = sum(
                server.temperature_c
                for server in active_servers
            ) / len(active_servers)
        else:
            average_temperature = 0

        total_power = sum(
            server.power_watts
            for server in self.servers
        )

        return {
            "rack_id": self.rack_id,
            "active_servers": len(active_servers),
            "failed_servers": len(failed_servers),
            "average_temperature_c": round(
                average_temperature,
                2
            ),
            "power_watts": round(total_power, 2)
        }


class DataCenter:
    def __init__(self):
        self.racks = []

        for room_number in range(1, NUM_ROOMS + 1):
            for rack_number in range(1, RACKS_PER_ROOM + 1):
                rack_id = f"R{room_number}-{rack_number:02d}"

                rack = Rack(
                    rack_id=rack_id,
                    server_count=SERVERS_PER_RACK
                )

                self.racks.append(rack)

    def generate_telemetry(self):
        for rack in self.racks:
            rack.generate_telemetry()

    def get_telemetry(self):
        servers = []

        for rack in self.racks:
            for server in rack.servers:
                servers.append(server.get_telemetry())

        active_servers = [
            server
            for server in servers
            if server["status"] != "Offline"
        ]

        failed_servers = [
            server
            for server in servers
            if server["status"] == "Offline"
        ]

        if active_servers:
            average_temperature = sum(
                server["temperature_c"]
                for server in active_servers
            ) / len(active_servers)
        else:
            average_temperature = 0

        total_power = sum(
            server["power_watts"]
            for server in servers
        )

        alerts = []

        for server in servers:
            if server["status"] == "Offline":
                alerts.append({
                    "server_id": server["server_id"],
                    "type": "SERVER_OFFLINE",
                    "severity": "Critical",
                    "message": (
                        f"Server {server['server_id']} is offline."
                    )
                })

            if server["cpu_usage"] > 95:
                alerts.append({
                    "server_id": server["server_id"],
                    "type": "HIGH_CPU",
                    "severity": "Warning",
                    "message": (
                        f"Server {server['server_id']} "
                        "has high CPU utilization."
                    )
                })

            if server["temperature_c"] > 28:
                alerts.append({
                    "server_id": server["server_id"],
                    "type": "HIGH_TEMPERATURE",
                    "severity": "Warning",
                    "message": (
                        f"Server {server['server_id']} "
                        "has high temperature."
                    )
                })

        return {
            "timestamp": time.time(),
            "facility": {
                "active_servers": len(active_servers),
                "failed_servers": len(failed_servers),
                "it_power_watts": round(total_power, 2),
                "average_temperature_c": round(
                    average_temperature,
                    2
                )
            },
            "racks": [
                rack.get_telemetry()
                for rack in self.racks
            ],
            "servers": servers,
            "alerts": alerts
        }

    def print_summary(self, telemetry):
        print("=" * 60)
        print("DATA CENTER TELEMETRY")
        print("=" * 60)

        print(
            f"Active Servers: "
            f"{telemetry['facility']['active_servers']}"
        )

        print(
            f"Failed Servers: "
            f"{telemetry['facility']['failed_servers']}"
        )

        print(
            f"IT Power: "
            f"{telemetry['facility']['it_power_watts']} W"
        )

        print(
            f"Average Temperature: "
            f"{telemetry['facility']['average_temperature_c']} C"
        )

        print()

        for rack in telemetry["racks"]:
            print(
                f"{rack['rack_id']} | "
                f"Active: {rack['active_servers']} | "
                f"Failed: {rack['failed_servers']} | "
                f"Power: {rack['power_watts']} W | "
                f"Temp: {rack['average_temperature_c']} C"
            )

        print()

        for server in telemetry["servers"]:
            print(
                f"{server['server_id']} | "
                f"Status: {server['status']} | "
                f"CPU: {server['cpu_usage']}% | "
                f"Memory: {server['memory_usage']}% | "
                f"Network: {server['network_usage']} Mbps | "
                f"Power: {server['power_watts']} W | "
                f"Temp: {server['temperature_c']} C"
            )

        print()

        if telemetry["alerts"]:
            print("ALERTS:")

            for alert in telemetry["alerts"]:
                print(
                    f"[{alert['severity']}] "
                    f"{alert['type']} - "
                    f"{alert['message']}"
                )
        else:
            print("ALERTS: None")

        print()


def save_telemetry_to_database(telemetry):
    """Save all server telemetry to PostgreSQL."""

    for server in telemetry["servers"]:
        save_server_telemetry(server)


def main():
    data_center = DataCenter()

    # Deliberately fail one server so that
    # the failure simulation remains visible.
    data_center.racks[0].servers[1].fail()

    for _ in range(3):
        data_center.generate_telemetry()

        telemetry = data_center.get_telemetry()

        data_center.print_summary(telemetry)

        save_telemetry_to_database(telemetry)

        print("Telemetry saved to PostgreSQL.")
        print()

        time.sleep(2)


if __name__ == "__main__":
    main()