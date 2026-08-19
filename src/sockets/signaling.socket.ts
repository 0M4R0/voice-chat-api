import { Server, Socket } from "socket.io";

export const registerSignaling = (io: Server, socket: Socket) => {
  socket.on("signal", (payload: { type: string; data: any }) => {
    const roomId = socket.data.roomId;
    if (!roomId) return;

    // send only to the other participant
    socket.to(roomId).emit("signal", {
      from: socket.data.user.id,
      ...payload,
    });
  });
};
