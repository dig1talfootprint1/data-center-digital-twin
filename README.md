# Data Center Digital Twin
A simulated data center monitoring system built with Python, TypeScript, Node.js, and PostgreSQL.

A simulated data center monitoring system that models servers, racks, power usage, cooling, and system telemetry.

The project combines backend development, database management, data visualization, and scientific computing. It was built to explore how data-center infrastructure can be represented in software and monitored through real-time telemetry.

Overview

The digital twin represents a simplified data center made up of:

Rooms
Racks
Servers
Cooling systems
Power infrastructure

Each server generates telemetry such as CPU usage, memory usage, network traffic, power consumption, temperature, and status.

The telemetry is collected, stored, and displayed through a web-based dashboard.

System Architecture
                Data Center
                     │
                     ▼
             Python Simulator
                     │
                     ▼
                PostgreSQL
                     │
                     ▼
          Node.js / TypeScript API
                     │
                     ▼
              Web Dashboard

The system is designed so that server activity affects other parts of the simulated environment. For example, increased CPU usage increases power consumption and heat generation.

Main Features
Data Center Simulation

The system models:

Multiple rooms
Multiple racks per room
Multiple servers per rack
Server operating states
Rack-level statistics
Facility-level statistics
Server Telemetry

Each server produces telemetry including:

CPU utilization
Memory utilization
Disk utilization
Network traffic
Power consumption
Temperature
Server status
Rack Monitoring

Rack-level information includes:

Average temperature
Total power consumption
Active server count
Cooling status
Alerts
Facility Monitoring

The dashboard provides an overview of:

Total power consumption
IT power
Cooling power
PUE
Average temperature
Active servers
Active racks
System alerts
Technology Stack
Backend
Node.js
TypeScript
REST API
Simulation & Data Analysis
Python
NumPy
Python data analysis tools
Database
PostgreSQL
SQL
Frontend
HTML
CSS
TypeScript
JavaScript
Other
C
Git
GitHub
Data Flow
Server Workload
       │
       ▼
CPU / Memory / Network Usage
       │
       ▼
Power Consumption
       │
       ▼
Heat Generation
       │
       ▼
Telemetry
       │
       ▼
PostgreSQL
       │
       ▼
Node.js API
       │
       ▼
Dashboard

The telemetry is designed to have relationships between different measurements instead of being generated as completely independent random values.

For example, a server with a higher workload will generally consume more power and generate more heat.

Failure Simulation

The system can simulate different infrastructure events, including:

Server failures
Cooling failures
Power spikes
High server utilization
Abnormally high temperatures

These events can trigger alerts in the monitoring dashboard.

Example:

Cooling Failure
      ↓
Rack Temperature Increases
      ↓
Temperature Threshold Exceeded
      ↓
Critical Alert
Database

PostgreSQL is used to store the data-center structure and historical telemetry.

The database contains relationships between:

Data Center
     ↓
   Rooms
     ↓
   Racks
     ↓
  Servers
     ↓
 Telemetry

Historical telemetry allows the system to analyze changes in server workload, power consumption, and temperature over time.

Scientific Simulation

The initial project focuses on the digital twin and monitoring system.

A later extension adds a numerical model for heat generation and cooling within the data center.

The goal of this extension is to model temperature using differential equations and numerical methods rather than relying only on simulated sensor values.

Project Structure
data-center-digital-twin/
│
├── simulator/
│   └── Python telemetry simulation
│
├── backend/
│   └── Node.js / TypeScript API
│
├── frontend/
│   └── Web dashboard
│
├── database/
│   └── PostgreSQL schema and queries
│
├── docs/
│   └── Project documentation
│
└── README.md
Project Goals

This project was built to gain practical experience with:

Backend development
REST APIs
Database design
SQL
Real-time telemetry
Data visualization
Systems programming
Python programming
Numerical computing
Data-center infrastructure
Status

Completed core digital twin functionality, with additional scientific simulation features developed as extensions.

Future Improvements

Potential extensions include:

More detailed thermal modeling
Improved cooling models
Predictive maintenance
Energy optimization
More advanced anomaly detection
Cloud deployment
Containerization
Larger-scale simulations
