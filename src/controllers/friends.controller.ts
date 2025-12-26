import { Request, Response } from "express";
import {
  sendFriendRequest,
  getFriendRequests,
  respondToFriendRequest,
  getFriendsList,
  removeFriend,
} from "../services/friends.service";
import { getIO } from "../sockets/socket";

export const sendRequest = async (req: Request, res: Response) => {
  try {
    const { username, discriminator } = req.body;
    if (!username || !discriminator) {
      return res
        .status(400)
        .json({ message: "Username and discriminator are required" });
    }
    const result = await sendFriendRequest(
      req.userId as string,
      username,
      discriminator,
    );

    if (result.notify) {
      const io = getIO();
      io.to(result.notify.toUserId).emit(result.notify.type, {
        from: result.notify.from,
        createdAt: result.notify.createdAt,
      });
    }

    res.status(200).json(result);
  } catch (error: any) {
    res.status(error.status || 500).json({
      message: error.message || "Internal server error",
    });
  }
};

export const getRequests = async (req: Request, res: Response) => {
  try {
    const result = await getFriendRequests(req.userId as string);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

export const getFriends = async (req: Request, res: Response) => {
  try {
    const result = await getFriendsList(req.userId as string);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

export const respondToRequest = async (req: Request, res: Response) => {
  try {
    const { senderId, accept } = req.body;
    if (!senderId || typeof accept !== "boolean") {
      return res.status(400).json({
        message: "senderId and accept (boolean) are required",
      });
    }
    const result = await respondToFriendRequest(
      req.userId as string,
      senderId,
      accept,
    );

    if (result.notify) {
      const io = getIO();
      io.to(senderId).emit(result.notify.type, result.notify.data);
    }

    res.status(200).json(result);
  } catch (error: any) {
    res.status(error.status || 500).json({
      message: error.message || "Internal server error",
    });
  }
};

export const deleteFriend = async (req: Request, res: Response) => {
  try {
    const { friendId } = req.params; // Get friendId

    const result = await removeFriend(req.userId as string, friendId);

    if (result.notify) {
      const io = getIO();
      io.to(friendId).emit(result.notify.type, result.notify.data);
    }

    res.status(200).json(result);
  } catch (err: any) {
    res.status(err.status || 500).json({ message: err.message });
  }
};
