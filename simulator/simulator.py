import random
import time
from datetime import datetime


# -----------------------------
# Configuration
# -----------------------------

NUM_ROOMS = 1
RACKS_PER_ROOM = 2
SERVERS_PER_RACK = 3


# -----------------------------
# Server
# -----------------------------

class Server:

    def __init__(self, server_id, rack_id):
        self.server_id = server_id
        self.rack_id = rack_id

        self.cpu_usage = random.uniform(20, 60)
        self.memory_usage = random.uniform(30, 70)
        self.network_usage = random.uniform(50, 300)

        self.base_power = random.uniform(250, 400)

        self.temperature = 22.0
        self.status = "Online"
        self.failed = False

        self.power = 0

    def fail(self):
        """Simulate a server failure."""

        self.failed = True
        self.status = "Offline"

    def generate_telemetry(self):

        # Failed servers do not generate normal telemetry
        if self.failed:

            self.cpu_usage = 0
            self.memory_usage = 0
            self.network_usage = 0
            self.power = 0
            self.status = "Offline"

            return

        # Slowly change CPU utilization
        cpu_change = random.uniform(-8, 8)

        self.cpu_usage += cpu_change
        self.cpu_usage = max(5, min(self.cpu_usage, 100))

        # Memory changes more slowly
        memory_change = random.uniform(-3, 3)

        self.memory_usage += memory_change
        self.memory_usage = max(10, min(self.memory_usage, 95))

        # Network traffic
        network_change = random.uniform(-40, 40)

        self.network_usage += network_change
        self.network_usage = max(0, self.network_usage)

        # Power consumption depends on CPU usage
        cpu_factor = self.cpu_usage / 100

        self.power = self.base_power + (cpu_factor * 250)

        # Temperature depends on power consumption
        target_temperature = 22 + (self.power - 250) / 100

        # Gradually move toward target temperature
        self.temperature += (
            target_temperature - self.temperature
        ) * 0.15

        # Add a small amount of sensor noise
        self.temperature += random.uniform(-0.2, 0.2)

        # Determine server status
        if self.cpu_usage > 95:
            self.status = "High Load"
        else:
            self.status = "Online"

    def get_telemetry(self):

        return {
            "timestamp": datetime.now().isoformat(timespec="seconds"),
            "server_id": self.server_id,
            "rack_id": self.rack_id,
            "cpu_usage": round(self.cpu_usage, 2),
            "memory_usage": round(self.memory_usage, 2),
            "network_usage": round(self.network_usage, 2),
            "power_watts": round(self.power, 2),
            "temperature_c": round(self.temperature, 2),
            "status": self.status
        }


# -----------------------------
# Rack
# -----------------------------

class Rack:

    def __init__(self, rack_id):

        self.rack_id = rack_id

        self.servers = []

        for i in range(1, SERVERS_PER_RACK + 1):

            server_id = f"{rack_id}-S{i:02d}"

            server = Server(
                server_id,
                rack_id
            )

            self.servers.append(server)

    def generate_telemetry(self):

        for server in self.servers:
            server.generate_telemetry()

    def get_active_servers(self):

        return sum(
            1
            for server in self.servers
            if not server.failed
        )

    def get_failed_servers(self):

        return sum(
            1
            for server in self.servers
            if server.failed
        )

    def get_rack_temperature(self):

        active_servers = [
            server
            for server in self.servers
            if not server.failed
        ]

        if not active_servers:
            return 0

        total_temperature = sum(
            server.temperature
            for server in active_servers
        )

        return total_temperature / len(active_servers)

    def get_total_power(self):

        return sum(
            server.power
            for server in self.servers
        )

    def get_telemetry(self):

        return {
            "timestamp": datetime.now().isoformat(timespec="seconds"),
            "rack_id": self.rack_id,
            "temperature_c": round(
                self.get_rack_temperature(),
                2
            ),
            "power_watts": round(
                self.get_total_power(),
                2
            ),
            "active_servers": self.get_active_servers(),
            "failed_servers": self.get_failed_servers()
        }


# -----------------------------
# Data Center
# -----------------------------

class DataCenter:

    def __init__(self):

        self.racks = []

        for room in range(1, NUM_ROOMS + 1):

            for rack in range(1, RACKS_PER_ROOM + 1):

                rack_id = f"R{room}-{rack:02d}"

                self.racks.append(
                    Rack(rack_id)
                )

    def generate_telemetry(self):

        for rack in self.racks:
            rack.generate_telemetry()

    def get_active_servers(self):

        return sum(
            rack.get_active_servers()
            for rack in self.racks
        )

    def get_failed_servers(self):

        return sum(
            rack.get_failed_servers()
            for rack in self.racks
        )

    def get_total_power(self):

        return sum(
            rack.get_total_power()
            for rack in self.racks
        )

    def get_average_temperature(self):

        active_servers = []

        for rack in self.racks:

            for server in rack.servers:

                if not server.failed:
                    active_servers.append(server)

        if not active_servers:
            return 0

        total_temperature = sum(
            server.temperature
            for server in active_servers
        )

        return total_temperature / len(active_servers)

    def get_alerts(self):

        alerts = []

        for rack in self.racks:

            for server in rack.servers:

                if server.status == "Offline":

                    alerts.append({
                        "type": "SERVER_OFFLINE",
                        "severity": "Critical",
                        "server_id": server.server_id,
                        "rack_id": server.rack_id,
                        "message": (
                            f"{server.server_id} is offline"
                        )
                    })

                elif server.status == "High Load":

                    alerts.append({
                        "type": "HIGH_CPU",
                        "severity": "Warning",
                        "server_id": server.server_id,
                        "rack_id": server.rack_id,
                        "message": (
                            f"{server.server_id} is under high load"
                        )
                    })

                if server.temperature > 28:

                    alerts.append({
                        "type": "HIGH_TEMPERATURE",
                        "severity": "Warning",
                        "server_id": server.server_id,
                        "rack_id": server.rack_id,
                        "message": (
                            f"{server.server_id} temperature is high"
                        )
                    })

        return alerts

    def get_telemetry(self):

        total_power = self.get_total_power()

        rack_telemetry = [
            rack.get_telemetry()
            for rack in self.racks
        ]

        server_telemetry = []

        for rack in self.racks:

            for server in rack.servers:
                server_telemetry.append(
                    server.get_telemetry()
                )

        return {
            "timestamp": datetime.now().isoformat(
                timespec="seconds"
            ),

            "facility": {
                "active_servers": self.get_active_servers(),
                "failed_servers": self.get_failed_servers(),
                "it_power_watts": round(
                    total_power,
                    2
                ),
                "average_temperature_c": round(
                    self.get_average_temperature(),
                    2
                )
            },

            "racks": rack_telemetry,

            "servers": server_telemetry,

            "alerts": self.get_alerts()
        }

    def print_summary(self):

        telemetry = self.get_telemetry()

        facility = telemetry["facility"]

        print("\n" + "=" * 80)

        print(
            f"DATA CENTER TELEMETRY | "
            f"{telemetry['timestamp']}"
        )

        print("=" * 80)

        for rack in self.racks:

            rack_telemetry = rack.get_telemetry()

            print(
                f"{rack.rack_id:<8} "
                f"Temp: "
                f"{rack_telemetry['temperature_c']:>5.1f} °C | "
                f"Power: "
                f"{rack_telemetry['power_watts']:>7.1f} W | "
                f"Active: "
                f"{rack_telemetry['active_servers']} | "
                f"Failed: "
                f"{rack_telemetry['failed_servers']}"
            )

            for server in rack.servers:

                print(
                    f"    {server.server_id:<10} "
                    f"CPU: {server.cpu_usage:>5.1f}% | "
                    f"RAM: {server.memory_usage:>5.1f}% | "
                    f"Network: {server.network_usage:>6.1f} Mbps | "
                    f"Power: {server.power:>6.1f} W | "
                    f"Temp: {server.temperature:>5.1f} °C | "
                    f"{server.status}"
                )

        print("-" * 80)

        print(
            f"Active Servers: "
            f"{facility['active_servers']}"
        )

        print(
            f"Failed Servers: "
            f"{facility['failed_servers']}"
        )

        print(
            f"Average Facility Temperature: "
            f"{facility['average_temperature_c']:.2f} °C"
        )

        print(
            f"Total Facility IT Power: "
            f"{facility['it_power_watts'] / 1000:.2f} kW"
        )

        print("-" * 80)

        alerts = telemetry["alerts"]

        if alerts:

            print(f"ALERTS: {len(alerts)}")

            for alert in alerts:

                print(
                    f"[{alert['severity']}] "
                    f"{alert['type']}: "
                    f"{alert['message']}"
                )

        else:

            print("ALERTS: None")

        print("=" * 80)


# -----------------------------
# Main simulation
# -----------------------------

def main():

    data_center = DataCenter()

    # Deliberately fail one server for testing
    data_center.racks[0].servers[1].fail()

    print("Starting Data Center Digital Twin...")

    print(
        f"Rooms: {NUM_ROOMS} | "
        f"Racks: {NUM_ROOMS * RACKS_PER_ROOM} | "
        f"Servers: "
        f"{NUM_ROOMS * RACKS_PER_ROOM * SERVERS_PER_RACK}"
    )

    for _ in range(3):

        data_center.generate_telemetry()

        data_center.print_summary()

        time.sleep(2)


if __name__ == "__main__":
    main()