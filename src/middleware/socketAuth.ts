import { Socket } from "socket.io";
import { AuthTokenPayload, verifyToken } from "../utils/jwt.js";

export interface AuthenticatedSocket extends Socket {
  data: { auth: AuthTokenPayload };
}

export function requireSocketAuth(socket: Socket, next: (error?: Error) => void): void {
  const token = socket.handshake.auth.token;
  if (typeof token !== "string") return next(new Error("Authentication token is required"));

  try {
    (socket as AuthenticatedSocket).data.auth = verifyToken(token);
    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
}
