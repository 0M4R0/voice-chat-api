import { Server, Socket } from "socket.io";
import http from "http";
import { config } from "../config/config";
import { authMiddleware } from "./auth.socket";
import { registerMatchmaking } from "./matchmaking.socket";
import { registerSignaling } from "./signaling.socket";

let io: Server;

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: config.clientUrls,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(authMiddleware);

  io.on("connection", (socket) => {
    registerMatchmaking(io, socket);
    registerSignaling(io, socket);
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
};
