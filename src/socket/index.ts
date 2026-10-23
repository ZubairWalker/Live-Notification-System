import { Server } from "socket.io";
import { requireSocketAuth, AuthenticatedSocket } from "../middleware/socketAuth.js";
import { NotificationModel } from "../models/Notification.js";

export function configureSocketServer(io: Server): void {
  io.use(requireSocketAuth);
  io.on("connection", (rawSocket) => {
    const socket = rawSocket as AuthenticatedSocket;
    void initializeConnection(socket);
  });
}

async function initializeConnection(socket: AuthenticatedSocket): Promise<void> {
  try {
    const { userId } = socket.data.auth;
    await socket.join(`user:${userId}`);

    const unread = await NotificationModel.countDocuments({ userId, read: false });
    socket.emit("notification:count", { unread });
    socket.on("notification:ping", () => socket.emit("notification:pong", { timestamp: new Date().toISOString() }));
  } catch (error) {
    console.error("Could not initialize socket connection", error);
    socket.emit("notification:error", { message: "Could not load notifications" });
    socket.disconnect(true);
  }
}
