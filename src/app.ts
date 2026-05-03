import express from "express";
import healthRouter from "./routes/health.route";
import apiRouter from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";

const app = express();

app.use(express.json());

// routes
app.use("/health", healthRouter);
app.use("/api", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;