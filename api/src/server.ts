import express from "express";
import serversRouter from "./routes/servers";
import latestTelemetryRouter from "./routes/telemetry/latest";
import summaryRouter from "./routes/summary";


const app = express();

const PORT = 3000;


app.use(express.json());


app.get("/api/health", (_request, response) => {
    response.json({
        status: "ok",
        service: "data-center-digital-twin-api"
    });
});


app.use("/api/servers", serversRouter);

app.use("/api/telemetry/latest", latestTelemetryRouter);

app.use("/api/summary", summaryRouter);


app.listen(PORT, () => {
    console.log(
        `API server running at http://localhost:${PORT}`
    );
});