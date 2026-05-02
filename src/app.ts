import express from "express";
import healthRouter from "./routes/health.route";

const app = express();

app.use(express.json());

// routes
app.use("/health", healthRouter);

export default app;