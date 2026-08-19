import express from "express";
import cors from "cors";
import helmet from "helmet";
import profileRoutes from "./routes/profile.routes";
import sessionRoutes from "./routes/session.routes";
import blocksRoutes from "./routes/blocks.routes";
import reportsRoutes from "./routes/reports.routes";

const app = express();

app.use(helmet());

// If production, then use frontend url. If not production, then use these origins
const ALLOWED_ORIGINS =
  process.env.NODE_ENV === "production"
    ? [process.env.FRONTEND_URL].filter(Boolean)
    : ["http://localhost:5173"];

const corsOptions = {
  origin: (origin: any, callback: any) => {
    // Block request with no origins in production
    if (!origin) {
      if (process.env.NODE_ENV === "production") {
        return callback(new Error("Origin not allowed by CORS"));
      }

      // Allow request with no origin in development
      return callback(null, true);
    }

    // Allow request from trusted frontend origins
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    // Rejet everything else
    return callback(new Error("Origin not allowed by CORS"));
  },
};

app.use(
  cors({
    origin: corsOptions.origin,
    credentials: true,
  }),
);

app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/profiles", profileRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/blocks", blocksRoutes);
app.use("/api/reports", reportsRoutes);

export default app;
