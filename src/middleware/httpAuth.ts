import { NextFunction, Request, Response } from "express";
import { AuthTokenPayload, verifyToken } from "../utils/jwt.js";

export interface AuthenticatedRequest extends Request {
  auth?: AuthTokenPayload;
}

export function requireHttpAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const [scheme, token] = req.header("Authorization")?.split(" ") ?? [];
  if (scheme !== "Bearer" || !token) {
    res.status(401).json({ message: "Authorization header must use Bearer token" });
    return;
  }

  try {
    req.auth = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}
