import express from "express";
import cors from "cors";
import helmet from "helmet";
import profileRoutes from "./routes/profile.routes";
import sessionRoutes from "./routes/session.routes";
import blocksRoutes from "./routes/blocks.routes";
import reportsRoutes from "./routes/reports.routes";
import { config } from "./config/config";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(helmet());

const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (error: Error | null, allowed?: boolean) => void,
  ) => {
    if (!origin) {
      return callback(null, true);
    }

    if (config.clientUrls.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin not allowed by CORS"));
  },
};

app.use(express.json());

app.use(
  cors({
    origin: corsOptions.origin,
    credentials: true,
  }),
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
app.use("/api/profiles", profileRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/blocks", blocksRoutes);
app.use("/api/reports", reportsRoutes);

app.use(errorHandler);

export default app;
