export interface TelemetryRow {
    telemetry_id: string;
    server_id: number;
    recorded_at: Date | string;
    cpu_usage: string | number | null;
    memory_usage: string | number | null;
    network_usage_mbps: string | number | null;
    power_watts: string | number | null;
    temperature_c: string | number | null;
}


export function formatTelemetryRow(row: TelemetryRow) {
    return {
        ...row,
        cpu_usage: row.cpu_usage === null
            ? null
            : Number(row.cpu_usage),

        memory_usage: row.memory_usage === null
            ? null
            : Number(row.memory_usage),

        network_usage_mbps: row.network_usage_mbps === null
            ? null
            : Number(row.network_usage_mbps),

        power_watts: row.power_watts === null
            ? null
            : Number(row.power_watts),

        temperature_c: row.temperature_c === null
            ? null
            : Number(row.temperature_c)
    };
}