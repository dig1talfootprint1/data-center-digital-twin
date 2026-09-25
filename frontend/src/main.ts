import "./style.css";


interface Summary {
    total_servers: number;
    online_servers: number;
    failed_servers: number;
    average_cpu_usage: number;
    average_memory_usage: number;
    average_temperature_c: number;
    total_network_usage_mbps: number;
    total_power_watts: number;
}


interface Server {
    server_id: number;
    server_name: string;
    status: string;
    rack_name: string;
    room_name: string;
    data_center_name: string;
}


interface Telemetry {
    telemetry_id: string;
    server_id: number;
    recorded_at: string;
    cpu_usage: number | null;
    memory_usage: number | null;
    network_usage_mbps: number | null;
    power_watts: number | null;
    temperature_c: number | null;
}


interface Alert {
    alert_id: string;
    server_id: number | null;
    server_name: string | null;
    created_at: string;
    alert_type: string;
    severity: string;
    message: string;
    resolved: boolean;
    resolved_at: string | null;
}


const API_BASE_URL = "http://localhost:3000";

const POLLING_INTERVAL_MS = 5000;

let selectedServerId: number | null = null;

let pollingInProgress = false;


async function fetchSummary(): Promise<Summary> {

    const response = await fetch(
        `${API_BASE_URL}/api/summary`
    );

    if (!response.ok) {
        throw new Error(
            `Summary API request failed with status ${response.status}`
        );
    }

    return response.json();
}


async function fetchServers(): Promise<Server[]> {

    const response = await fetch(
        `${API_BASE_URL}/api/servers`
    );

    if (!response.ok) {
        throw new Error(
            `Servers API request failed with status ${response.status}`
        );
    }

    return response.json();
}


async function fetchAlerts(): Promise<Alert[]> {

    const response = await fetch(
        `${API_BASE_URL}/api/alerts`
    );

    if (!response.ok) {
        throw new Error(
            `Alerts API request failed with status ${response.status}`
        );
    }

    return response.json();
}


async function fetchServer(
    serverId: number
): Promise<Server> {

    const response = await fetch(
        `${API_BASE_URL}/api/servers/${serverId}`
    );

    if (!response.ok) {
        throw new Error(
            `Server API request failed with status ${response.status}`
        );
    }

    return response.json();
}


async function fetchServerTelemetry(
    serverId: number
): Promise<Telemetry[]> {

    const response = await fetch(
        `${API_BASE_URL}/api/servers/${serverId}/telemetry`
    );

    if (!response.ok) {
        throw new Error(
            `Telemetry API request failed with status ${response.status}`
        );
    }

    return response.json();
}


function renderRack(
    rackName: string,
    servers: Server[]
): string {

    const serverButtons = servers
        .map((server) => {

            const isFailed =
                server.status.toLowerCase() === "failed";

            const statusClass =
                isFailed ? "failed" : "online";

            return `
                <button
                    class="server ${statusClass}"
                    data-server-id="${server.server_id}"
                >
                    <span class="server-light"></span>
                    <span>${server.server_name}</span>
                </button>
            `;
        })
        .join("");


    return `
        <div class="rack">

            <div class="rack-header">
                <span>${rackName}</span>
                <span>${servers.length} SERVERS</span>
            </div>

            ${serverButtons}

        </div>
    `;
}


function renderInfrastructure(
    servers: Server[]
): string {

    const rooms =
        new Map<string, Map<string, Server[]>>();


    for (const server of servers) {

        if (!rooms.has(server.room_name)) {

            rooms.set(
                server.room_name,
                new Map<string, Server[]>()
            );
        }


        const racks =
            rooms.get(server.room_name)!;


        if (!racks.has(server.rack_name)) {

            racks.set(
                server.rack_name,
                []
            );
        }


        racks.get(server.rack_name)!.push(server);
    }


    let roomHtml = "";


    for (const [roomName, racks] of rooms) {

        let rackHtml = "";


        for (
            const [rackName, rackServers]
            of racks
        ) {

            rackHtml += renderRack(
                rackName,
                rackServers
            );
        }


        roomHtml += `
            <div class="room">

                <div class="room-header">
                    <span>${roomName}</span>
                    <span>${racks.size} RACKS</span>
                </div>

                <div class="rack-grid">
                    ${rackHtml}
                </div>

            </div>
        `;
    }


    return roomHtml;
}


function formatChartValue(
    value: number,
    unit: string
): string {

    return `${value.toFixed(2)}${unit}`;
}


function createLineChart(
    telemetry: Telemetry[],
    metric: "cpu" | "memory" | "temperature" | "power"
): string {

    const width = 760;
    const height = 230;

    const paddingLeft = 48;
    const paddingRight = 20;
    const paddingTop = 24;
    const paddingBottom = 30;


    let values: number[] = [];
    let unit = "";
    let title = "";
    let keyLabel = "";


    if (metric === "cpu") {

        values = telemetry
            .map((record) => record.cpu_usage)
            .filter(
                (value): value is number =>
                    value !== null
            );

        unit = "%";
        title = "CPU Usage";
        keyLabel = "CPU";

    } else if (metric === "memory") {

        values = telemetry
            .map((record) => record.memory_usage)
            .filter(
                (value): value is number =>
                    value !== null
            );

        unit = "%";
        title = "Memory Usage";
        keyLabel = "MEMORY";

    } else if (metric === "temperature") {

        values = telemetry
            .map((record) => record.temperature_c)
            .filter(
                (value): value is number =>
                    value !== null
            );

        unit = "°C";
        title = "Temperature";
        keyLabel = "TEMP";

    } else {

        values = telemetry
            .map((record) => {

                if (record.power_watts === null) {
                    return null;
                }

                return record.power_watts / 1000;
            })
            .filter(
                (value): value is number =>
                    value !== null
            );

        unit = " kW";
        title = "Power Consumption";
        keyLabel = "POWER";
    }


    if (values.length === 0) {

        return `
            <div class="chart-card">

                <div class="chart-header">

                    <span>
                        ${keyLabel}
                    </span>

                    <strong>
                        No data
                    </strong>

                </div>

                <div class="chart-empty">
                    No telemetry data available.
                </div>

            </div>
        `;
    }


    let minValue = Math.min(...values);
    let maxValue = Math.max(...values);


    if (minValue === maxValue) {

        minValue -= 1;
        maxValue += 1;
    }


    const valueRange =
        maxValue - minValue;


    const chartWidth =
        width - paddingLeft - paddingRight;

    const chartHeight =
        height - paddingTop - paddingBottom;


    const points = values.map(
        (value, index) => {

            const x =
                values.length === 1
                    ? paddingLeft + chartWidth / 2
                    : paddingLeft +
                      (
                          index /
                          (values.length - 1)
                      ) *
                      chartWidth;


            const y =
                paddingTop +
                (
                    1 -
                    (
                        (value - minValue) /
                        valueRange
                    )
                ) *
                chartHeight;


            return {
                x,
                y,
                value
            };
        }
    );


    const pathData =
        points
            .map(
                (point, index) =>
                    `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
            )
            .join(" ");


    const gridLines = [0, 0.5, 1]
        .map((position) => {

            const y =
                paddingTop +
                position * chartHeight;


            const value =
                maxValue -
                position * valueRange;


            return `
                <line
                    x1="${paddingLeft}"
                    y1="${y}"
                    x2="${width - paddingRight}"
                    y2="${y}"
                    class="chart-grid-line"
                />

                <text
                    x="${paddingLeft - 8}"
                    y="${y + 4}"
                    text-anchor="end"
                    class="chart-axis-label"
                >
                    ${formatChartValue(value, unit)}
                </text>
            `;
        })
        .join("");


    const circles =
        points
            .map((point) => {

                return `
                    <circle
                        cx="${point.x}"
                        cy="${point.y}"
                        r="3.5"
                        class="chart-point"
                    >
                        <title>
                            ${formatChartValue(point.value, unit)}
                        </title>
                    </circle>
                `;
            })
            .join("");


    return `
        <div class="chart-card">

            <div class="chart-header">

                <span>
                    ${keyLabel}
                </span>

                <strong>
                    ${title}
                </strong>

            </div>


            <div class="chart-container">

                <svg
                    viewBox="0 0 ${width} ${height}"
                    preserveAspectRatio="none"
                    class="telemetry-chart"
                    role="img"
                    aria-label="${title} over time"
                >

                    ${gridLines}

                    <path
                        d="${pathData}"
                        class="chart-line"
                    />

                    ${circles}

                </svg>

            </div>

        </div>
    `;
}


function renderTelemetryCharts(
    telemetry: Telemetry[]
): string {

    return `
        <div class="telemetry-charts">

            ${createLineChart(
                telemetry,
                "cpu"
            )}

            ${createLineChart(
                telemetry,
                "memory"
            )}

            ${createLineChart(
                telemetry,
                "temperature"
            )}

            ${createLineChart(
                telemetry,
                "power"
            )}

        </div>
    `;
}


function renderTelemetryHistory(
    telemetry: Telemetry[]
): string {

    const rows = telemetry
        .slice()
        .reverse()
        .map((record) => {

            const recordedAt =
                new Date(record.recorded_at);


            const time =
                recordedAt.toLocaleTimeString(
                    "en-US",
                    {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                    }
                );


            const powerKilowatts =
                (record.power_watts ?? 0) / 1000;


            return `
                <div class="telemetry-history-row">

                    <span>
                        ${time}
                    </span>

                    <span>
                        ${
                            record.cpu_usage === null
                                ? "—"
                                : `${record.cpu_usage.toFixed(2)}%`
                        }
                    </span>

                    <span>
                        ${
                            record.memory_usage === null
                                ? "—"
                                : `${record.memory_usage.toFixed(2)}%`
                        }
                    </span>

                    <span>
                        ${
                            record.temperature_c === null
                                ? "—"
                                : `${record.temperature_c.toFixed(2)}°C`
                        }
                    </span>

                    <span>
                        ${
                            record.network_usage_mbps === null
                                ? "—"
                                : `${record.network_usage_mbps.toFixed(2)} Mbps`
                        }
                    </span>

                    <span>
                        ${powerKilowatts.toFixed(2)} kW
                    </span>

                </div>
            `;
        })
        .join("");


    return `
        <div class="server-history">

            <div class="server-history-header">

                <span>
                    TELEMETRY HISTORY
                </span>

                <strong>
                    ${telemetry.length} RECORDS
                </strong>

            </div>


            <div class="telemetry-history">

                <div class="telemetry-history-header">

                    <span>TIME</span>
                    <span>CPU</span>
                    <span>MEMORY</span>
                    <span>TEMP</span>
                    <span>NETWORK</span>
                    <span>POWER</span>

                </div>


                ${rows}

            </div>

        </div>
    `;
}


function renderAlerts(
    alerts: Alert[]
): string {

    if (alerts.length === 0) {

        return `
            <div class="alerts-empty">

                <div class="alerts-empty-icon">
                    ✓
                </div>

                <div>

                    <strong>
                        No active alerts
                    </strong>

                    <span>
                        All monitored infrastructure is operating normally.
                    </span>

                </div>

            </div>
        `;
    }


    return alerts
        .map((alert) => {

            const createdAt =
                new Date(alert.created_at);


            const time =
                createdAt.toLocaleTimeString(
                    "en-US",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );


            const severity =
                alert.severity.toUpperCase();


            const severityClass =
                alert.severity.toLowerCase();


            return `
                <div class="alert-item">

                    <div class="alert-icon">
                        !
                    </div>


                    <div class="alert-content">

                        <strong>
                            ${alert.message}
                        </strong>

                        <span>
                            ${alert.alert_type}
                            ·
                            ${time}
                        </span>

                    </div>


                    <span
                        class="alert-severity ${severityClass}"
                    >
                        ${severity}
                    </span>

                </div>
            `;
        })
        .join("");
}


function renderDashboard(
    summary: Summary,
    servers: Server[],
    alerts: Alert[]
) {

    const powerKilowatts =
        summary.total_power_watts / 1000;


    const infrastructureHtml =
        renderInfrastructure(servers);


    document.querySelector<HTMLDivElement>(
        "#app"
    )!.innerHTML = `

        <div class="app-shell">

            <header class="topbar">

                <div>

                    <p class="eyebrow">
                        INFRASTRUCTURE MONITORING
                    </p>

                    <h1>
                        Data Center Digital Twin
                    </h1>

                </div>


                <div class="live-indicator">

                    <span class="live-dot"></span>

                    <span>
                        LIVE
                    </span>

                </div>

            </header>


            <main class="dashboard">


                <section class="metrics-grid">


                    <article class="metric-card">

                        <span class="metric-label">
                            SERVERS
                        </span>

                        <strong class="metric-value">
                            ${summary.total_servers}
                        </strong>

                        <span class="metric-subtext">
                            Total infrastructure
                        </span>

                    </article>


                    <article class="metric-card">

                        <span class="metric-label">
                            ONLINE
                        </span>

                        <strong class="metric-value">
                            ${summary.online_servers}
                        </strong>

                        <span class="metric-subtext">
                            Operational servers
                        </span>

                    </article>


                    <article class="metric-card metric-warning">

                        <span class="metric-label">
                            FAILED
                        </span>

                        <strong class="metric-value">
                            ${summary.failed_servers}
                        </strong>

                        <span class="metric-subtext">
                            Requires attention
                        </span>

                    </article>


                    <article class="metric-card">

                        <span class="metric-label">
                            POWER
                        </span>

                        <strong class="metric-value">
                            ${powerKilowatts.toFixed(2)} kW
                        </strong>

                        <span class="metric-subtext">
                            Current consumption
                        </span>

                    </article>


                </section>



                <section class="main-grid">


                    <article class="panel infrastructure-panel">

                        <div class="panel-header">

                            <div>

                                <p class="panel-eyebrow">
                                    PHYSICAL LAYOUT
                                </p>

                                <h2>
                                    Data Center
                                </h2>

                            </div>


                            <span class="panel-status">
                                DC-01
                            </span>

                        </div>


                        ${infrastructureHtml}


                    </article>



                    <article class="panel telemetry-panel">

                        <div class="panel-header">

                            <div>

                                <p class="panel-eyebrow">
                                    SYSTEM TELEMETRY
                                </p>

                                <h2>
                                    Current Metrics
                                </h2>

                            </div>

                        </div>


                        <div class="telemetry-list">


                            <div class="telemetry-row">

                                <div>

                                    <span class="telemetry-name">
                                        CPU Usage
                                    </span>

                                    <span class="telemetry-description">
                                        Average across online servers
                                    </span>

                                </div>

                                <strong>
                                    ${summary.average_cpu_usage.toFixed(2)}%
                                </strong>

                            </div>


                            <div class="telemetry-row">

                                <div>

                                    <span class="telemetry-name">
                                        Memory Usage
                                    </span>

                                    <span class="telemetry-description">
                                        Average across online servers
                                    </span>

                                </div>

                                <strong>
                                    ${summary.average_memory_usage.toFixed(2)}%
                                </strong>

                            </div>


                            <div class="telemetry-row">

                                <div>

                                    <span class="telemetry-name">
                                        Temperature
                                    </span>

                                    <span class="telemetry-description">
                                        Average server temperature
                                    </span>

                                </div>

                                <strong>
                                    ${summary.average_temperature_c.toFixed(2)}°C
                                </strong>

                            </div>


                            <div class="telemetry-row">

                                <div>

                                    <span class="telemetry-name">
                                        Network
                                    </span>

                                    <span class="telemetry-description">
                                        Aggregate network activity
                                    </span>

                                </div>

                                <strong>
                                    ${summary.total_network_usage_mbps.toLocaleString(
                                        "en-US",
                                        {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        }
                                    )} Mbps
                                </strong>

                            </div>


                            <div class="telemetry-row">

                                <div>

                                    <span class="telemetry-name">
                                        Power
                                    </span>

                                    <span class="telemetry-description">
                                        Aggregate server power
                                    </span>

                                </div>

                                <strong>
                                    ${powerKilowatts.toFixed(2)} kW
                                </strong>

                            </div>


                        </div>


                    </article>


                </section>



                <section class="panel alerts-panel">

                    <div class="panel-header">

                        <div>

                            <p class="panel-eyebrow">
                                SYSTEM EVENTS
                            </p>

                            <h2>
                                Alerts
                            </h2>

                        </div>


                        <span class="alert-count">
                            ${alerts.length} ACTIVE
                        </span>

                    </div>


                    <div class="alerts-list">

                        ${renderAlerts(alerts)}

                    </div>

                </section>



                <section
                    id="server-details"
                    class="panel server-details-panel"
                    hidden
                >
                </section>


            </main>

        </div>
    `;


    attachServerClickHandlers();
}


function attachServerClickHandlers() {

    const serverButtons =
        document.querySelectorAll<HTMLButtonElement>(
            ".server"
        );


    serverButtons.forEach((button) => {

        button.addEventListener(
            "click",
            async () => {

                const serverId =
                    Number(
                        button.dataset.serverId
                    );


                if (!Number.isInteger(serverId)) {
                    return;
                }


                selectedServerId = serverId;

                await showServerDetails(serverId);
            }
        );
    });
}


async function showServerDetails(
    serverId: number
) {

    const detailsPanel =
        document.querySelector<HTMLElement>(
            "#server-details"
        );


    if (!detailsPanel) {
        return;
    }


    detailsPanel.hidden = false;


    detailsPanel.innerHTML = `

        <div class="panel-header">

            <div>

                <p class="panel-eyebrow">
                    SERVER INSPECTION
                </p>

                <h2>
                    Loading server...
                </h2>

            </div>

        </div>

    `;


    try {

        const server =
            await fetchServer(serverId);


        const telemetry =
            await fetchServerTelemetry(serverId);


        const latestTelemetry =
            telemetry.length > 0
                ? telemetry[telemetry.length - 1]
                : null;


        if (!latestTelemetry) {

            detailsPanel.innerHTML = `

                <div class="panel-header">

                    <div>

                        <p class="panel-eyebrow">
                            SERVER INSPECTION
                        </p>

                        <h2>
                            ${server.server_name}
                        </h2>

                    </div>

                </div>


                <p class="server-no-data">
                    No telemetry data is available
                    for this server.
                </p>

            `;

            return;
        }


        const powerKilowatts =
            (latestTelemetry.power_watts ?? 0) / 1000;


        detailsPanel.innerHTML = `

            <div class="panel-header">

                <div>

                    <p class="panel-eyebrow">
                        SERVER INSPECTION
                    </p>

                    <h2>
                        ${server.server_name}
                    </h2>

                </div>


                <span class="panel-status">
                    ${server.status.toUpperCase()}
                </span>

            </div>


            <div class="server-location">

                <span>
                    ${server.data_center_name}
                </span>

                <span>→</span>

                <span>
                    ${server.room_name}
                </span>

                <span>→</span>

                <span>
                    ${server.rack_name}
                </span>

            </div>


            <div class="server-telemetry-grid">


                <div class="server-metric">

                    <span>
                        CPU
                    </span>

                    <strong>
                        ${
                            latestTelemetry.cpu_usage === null
                                ? "—"
                                : `${latestTelemetry.cpu_usage.toFixed(2)}%`
                        }
                    </strong>

                </div>


                <div class="server-metric">

                    <span>
                        MEMORY
                    </span>

                    <strong>
                        ${
                            latestTelemetry.memory_usage === null
                                ? "—"
                                : `${latestTelemetry.memory_usage.toFixed(2)}%`
                        }
                    </strong>

                </div>


                <div class="server-metric">

                    <span>
                        TEMPERATURE
                    </span>

                    <strong>
                        ${
                            latestTelemetry.temperature_c === null
                                ? "—"
                                : `${latestTelemetry.temperature_c.toFixed(2)}°C`
                        }
                    </strong>

                </div>


                <div class="server-metric">

                    <span>
                        NETWORK
                    </span>

                    <strong>
                        ${
                            latestTelemetry.network_usage_mbps === null
                                ? "—"
                                : `${latestTelemetry.network_usage_mbps.toFixed(2)} Mbps`
                        }
                    </strong>

                </div>


                <div class="server-metric">

                    <span>
                        POWER
                    </span>

                    <strong>
                        ${powerKilowatts.toFixed(2)} kW
                    </strong>

                </div>


            </div>


            <div class="server-chart-section">

                <div class="server-chart-section-header">

                    <div>

                        <p class="panel-eyebrow">
                            TELEMETRY ANALYSIS
                        </p>

                        <h3>
                            Historical Performance
                        </h3>

                    </div>

                    <span>
                        ${telemetry.length} DATA POINTS
                    </span>

                </div>


                ${renderTelemetryCharts(telemetry)}

            </div>


            ${renderTelemetryHistory(telemetry)}

        `;


        detailsPanel.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });


    } catch (error) {

        console.error(error);


        detailsPanel.innerHTML = `

            <div class="panel-header">

                <div>

                    <p class="panel-eyebrow">
                        SERVER INSPECTION
                    </p>

                    <h2>
                        Unable to load server
                    </h2>

                </div>

            </div>


            <p class="server-no-data">
                The server telemetry could not
                be retrieved from the API.
            </p>

        `;
    }
}


async function refreshDashboard() {

    if (pollingInProgress) {
        return;
    }


    pollingInProgress = true;


    try {

        const [
            summary,
            servers,
            alerts
        ] = await Promise.all([
            fetchSummary(),
            fetchServers(),
            fetchAlerts()
        ]);


        renderDashboard(
            summary,
            servers,
            alerts
        );


        if (selectedServerId !== null) {

            await showServerDetails(
                selectedServerId
            );
        }


    } catch (error) {

        console.error(
            "Dashboard refresh failed:",
            error
        );


        const liveIndicator =
            document.querySelector(
                ".live-indicator"
            );


        if (liveIndicator) {

            liveIndicator.classList.add(
                "connection-error"
            );

            liveIndicator.innerHTML = `

                <span class="live-dot"></span>

                <span>
                    CONNECTION ERROR
                </span>

            `;
        }


    } finally {

        pollingInProgress = false;
    }
}


async function loadDashboard() {

    try {

        const [
            summary,
            servers,
            alerts
        ] = await Promise.all([
            fetchSummary(),
            fetchServers(),
            fetchAlerts()
        ]);


        renderDashboard(
            summary,
            servers,
            alerts
        );


        setInterval(
            refreshDashboard,
            POLLING_INTERVAL_MS
        );


    } catch (error) {

        console.error(error);


        document.querySelector<HTMLDivElement>(
            "#app"
        )!.innerHTML = `

            <div class="error-screen">

                <h1>
                    Data Center Digital Twin
                </h1>

                <p>
                    Unable to load data from the monitoring API.
                </p>

                <p>
                    Make sure the API is running on
                    http://localhost:3000
                </p>

            </div>

        `;
    }
}


loadDashboard();