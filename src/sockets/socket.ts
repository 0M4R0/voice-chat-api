import { Server, Socket } from "socket.io";
import http from "http";
import { verifyAccessToken } from "../utils/jwt";
import { Message } from "../models/Message";
import {
  getFriendsList,
  getFriendRequests,
  sendFriendRequest,
  respondToFriendRequest,
} from "../services/friends.service";
import { sendPrivateMessage } from "../services/messages.service";

let io: Server;

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    // Get token from handshake
    const token: string | undefined =
      socket.handshake.auth.token || socket.handshake.headers.authorization;
    if (!token) return next(new Error("Authentication error"));

    try {
      // Verify token, decode and extract user ID for the socket data
      const cleanToken = token.replace("Bearer ", "");
      const decoded = verifyAccessToken(cleanToken);
      socket.data.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId: string = socket.data.userId;
    console.log(`User connected: ${userId}`);

    // Join to personal room
    socket.join(userId);

    // Handle private Messages
    socket.on("private_message", async ({ content, toUserId }) => {
      try {
        const newMessage = await sendPrivateMessage(userId, toUserId, content);

        // Send message to both sender and recipient using unified event
        io.to(toUserId).emit("new_private_message", newMessage); // Receiver
        io.to(userId).emit("new_private_message", newMessage); // Sender
      } catch (error) {
        console.error("Error sending private message:", error);
        socket.emit("message_error", { error: "Couldn't send message" });
      }
    });

    // Handle get_friends event
    socket.on("get_friends", async () => {
      try {
        const friends = await getFriendsList(userId);
        socket.emit("friends_list", friends);
      } catch (error) {
        console.error("Error getting friends list:", error);
        socket.emit("friends_list", []);
      }
    });

    // Handle get_friend_requests event
    socket.on("get_friend_requests", async () => {
      try {
        const requests = await getFriendRequests(userId);
        socket.emit("friend_requests", requests);
      } catch (error) {
        console.error("Error getting friend requests:", error);
        socket.emit("friend_requests", []);
      }
    });

    // Handle send_friend_request event
    socket.on("send_friend_request", async ({ username, discriminator }) => {
      try {
        const result = await sendFriendRequest(userId, username, discriminator);
        socket.emit("friend_request_sent", result);

        // Handle notify
        if (result.notify) {
          io.to(result.notify.toUserId).emit(result.notify.type, {
            from: result.notify.from,
            createdAt: result.notify.createdAt,
          });
        }
      } catch (error) {
        console.error("Error sending friend request:", error);
        socket.emit("friend_request_error", {
          error: "Failed to send friend request",
        });
      }
    });

    // Handle respond to friend request event
    socket.on("respond_friend_request", async ({ senderId, accept }) => {
      try {
        const result = await respondToFriendRequest(userId, senderId, accept);
        socket.emit("friend_request_response", result);

        // Handle notify if present (for acceptor)
        if (result.notify) {
          io.to(senderId).emit(result.notify.type, result.notify.data); // Notify original sender
        }
      } catch (error) {
        console.error("Error responding to friend request:", error);
        socket.emit("friend_request_error", {
          error: "Failed to respond to friend request",
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${userId}`);
      socket.leave(userId);
    });
  });
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};
