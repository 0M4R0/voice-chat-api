import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes";
import friendsRouter from "./routes/friends.routes";
import messagesRouter from "./routes/messages.routes";
import http from "http";
import { initSocket } from "./sockets/socket";
import { connectToDatabase } from "./config/database";
import { protect } from "./middleware/auth";
import { me } from "./controllers/auth.controller";
import { apiLimiter } from "./middleware/rateLimiter";

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);
initSocket(server);

const corsOptions = {
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  if (req.path === "/auth/refresh-token") {
    return next();
  }
  apiLimiter(req, res, next);
});

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "API VoiceChat - Working perfectly!" });
});

// Public routes
app.use("/auth", authRouter);
app.get("/me", protect, me);
app.use("/friends", friendsRouter);
app.use("/chat", messagesRouter);

connectToDatabase()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(() => {
    console.error("Database connection failed");
    process.exit(1);
  });
