import { Server, Socket } from "socket.io";
import http from "http";
import { authMiddleware } from "./auth.socket";
import { registerMatchmaking } from "./matchmaking.socket";
import { registerSignaling } from "./signaling.socket";

let io: Server;

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"],
    },
  });

  io.use(authMiddleware);

  io.on("connection", (socket) => {
    registerMatchmaking(io, socket);
    registerSignaling(io, socket);

    socket.on("disconnect", (reason) => {
      // cleanup matchmaking + room state here
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
};
