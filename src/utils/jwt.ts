import jwt from "jsonwebtoken";

export interface AuthTokenPayload {
  userId: string;
  username: string;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required. Copy .env.example to .env first.");
  return secret;
}

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthTokenPayload {
  const payload = jwt.verify(token, getSecret());
  if (typeof payload === "string" || !payload.userId || !payload.username) {
    throw new Error("Invalid token payload");
  }
  return { userId: payload.userId, username: payload.username };
}
