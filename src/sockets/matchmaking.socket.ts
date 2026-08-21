import { Server, Socket } from "socket.io";
import {
  addToQueue,
  removeFromQueue,
  findMatch,
} from "../services/matchmaking.service";
import { endSession, type SessionEndReason } from "../services/session.service";

const SESSION_DURATION_MS = 3 * 60 * 1000; // 3 minutes

export const registerMatchmaking = (io: Server, socket: Socket) => {
  // The user ID comes from the verified JWT, never from client-supplied auth data.
  const userId = socket.data.user.id as string;

  const finishSession = async (roomId: string, reason: SessionEndReason) => {
    const roomSocketIds =
      io.sockets.adapter.rooms.get(roomId) ?? new Set<string>();

    const roomSockets = Array.from(roomSocketIds)
      .map((socketId) => io.sockets.sockets.get(socketId))
      .filter((roomSocket): roomSocket is Socket => Boolean(roomSocket));

    if (!roomSockets.includes(socket)) {
      roomSockets.push(socket);
    }

    const sessionId = roomSockets.find(
      (roomSocket) => roomSocket.data.sessionId,
    )?.data.sessionId as string | undefined;

    if (sessionId) {
      // Session cleanup is centralized in the session service.
      await endSession(socket.data.supabase, sessionId, reason).catch(
        () => undefined,
      );

      io.to(roomId).emit("session_ended", { reason, sessionId });
    }

    for (const roomSocket of roomSockets) {
      if (roomSocket.data.sessionTimer) {
        clearTimeout(roomSocket.data.sessionTimer);
      }
      roomSocket.leave(roomId);
      delete roomSocket.data.roomId;
      delete roomSocket.data.sessionId;
      delete roomSocket.data.sessionTimer;
    }
  };

  const requestMatch = async (target: Socket = socket) => {
    const targetUserId = target.data.user.id as string;

    try {
      const supabase = target.data.supabase;

      // Check if the target socket is already connected to a room
      if (target.data.roomId) {
        return;
      }

      await addToQueue(supabase, targetUserId, target.id);
      const match = await findMatch(supabase, targetUserId);

      if (match) {
        const { userA, userB, session } = match;

        // Create the room and emit the match result
        const sessionRecord = session.session;
        const roomId = sessionRecord.id;

        const socketA = io.sockets.sockets.get(userA.socketId);
        const socketB = io.sockets.sockets.get(userB.socketId);

        if (!socketA || !socketB) {
          // if one of the sockets is not found, remove both from the queue
          removeFromQueue(userA.userId);
          removeFromQueue(userB.userId);
          await endSession(supabase, sessionRecord.id, "cancelled").catch(
            () => undefined,
          );
          return;
        }

        socketA.join(roomId);
        socketB.join(roomId);
        socketA.data.roomId = roomId;
        socketB.data.roomId = roomId;
        socketA.data.sessionId = sessionRecord.id;
        socketB.data.sessionId = sessionRecord.id;

        const payloadA = {
          roomId,
          sessionId: sessionRecord.id,
          peerId: userB.userId,
          session: sessionRecord,
        };
        const payloadB = {
          roomId,
          sessionId: sessionRecord.id,
          peerId: userA.userId,
          session: sessionRecord,
        };

        socketA.emit("match_found", payloadA);
        socketB.emit("match_found", payloadB);

        const timer = setTimeout(async () => {
          await finishSession(roomId, "timeout");
        }, SESSION_DURATION_MS);

        socketA.data.sessionTimer = timer;
        socketB.data.sessionTimer = timer;
      } else {
        target.emit("waiting");
      }
    } catch (err: any) {
      target.emit("match_error", { message: err.message });
      removeFromQueue(targetUserId);
    }
  };

  socket.on("find_match", () => requestMatch());

  socket.on("cancel_match", () => {
    removeFromQueue(userId);
  });

  socket.on("leave_session", async () => {
    const roomId = socket.data.roomId;
    if (roomId) {
      socket.to(roomId).emit("peer_left", { userId });
      await finishSession(roomId, "completed");
    }
    removeFromQueue(userId);
  });

  socket.on("next", async () => {
    const roomId = socket.data.roomId;
    if (!roomId) {
      return await requestMatch();
    }

    // Get all peers in the room
    const roomSocketIds = io.sockets.adapter.rooms.get(roomId) ?? new Set<string>();

    // Filter out any peers that are no longer connected.
    const roomSockets = Array.from(roomSocketIds)
      .map((id) => io.sockets.sockets.get(id))
      .filter((s): s is Socket => Boolean(s));

    // Emit a "peer_left" event and finish the session.
    socket.to(roomId).emit("peer_left", { userId });
    await finishSession(roomId, "next");

    // Request a match for each peer in the room.
    await Promise.all(roomSockets.map((peer) => requestMatch(peer)));
  });

  socket.on("disconnect", async () => {
    removeFromQueue(userId);

    const roomId = socket.data.roomId;
    if (!roomId) {
      return;
    }

    // Get all peers in the room
    const roomSocketIds =
      io.sockets.adapter.rooms.get(roomId) ?? new Set<string>();

    // Get the remaining peers after filtering out the current socket.
    const remaining = Array.from(roomSocketIds)
      .map((id) => io.sockets.sockets.get(id))
      .filter((s): s is Socket => Boolean(s) && s?.id !== socket.id);

    socket.to(roomId).emit("peer_disconnected", { userId });
    await finishSession(roomId, "disconnect");

    // Request a match for the remaining peers.
    await Promise.all(remaining.map((peer) => requestMatch(peer)));
  });
};
