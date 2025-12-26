import { Request, Response } from "express";
import {
  sendPrivateMessage,
  getConversation,
} from "../services/messages.service";
import { getIO } from "../sockets/socket";

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const { friendId, content } = req.body;

    if (!userId || !friendId || !content) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const message = await sendPrivateMessage(userId, friendId, content);
    const io = getIO();

    io.to(friendId).emit("new_private_message", message);
    io.to(userId).emit("new_private_message", message);

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const friendId = req.params.friendId; // Get the friend from the url
    if (!userId || !friendId) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const messages = await getConversation(userId, friendId);
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve messages" });
  }
};
