import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { dbOperations } from "./db";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";

export interface AuthPayload {
  userId: number;
  username: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): AuthPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch (error) {
    throw new Error("Invalid token");
  }
}

export function extractTokenFromHeader(
  authHeader: string | null,
): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}

export async function authenticateRequest(req: Request): Promise<AuthPayload> {
  const authHeader = req.headers.get("Authorization");
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    throw new Error("No token provided");
  }

  const payload = verifyToken(token);

  // Verify user still exists
  const user = dbOperations.getUserById(payload.userId);
  if (!user) {
    throw new Error("User not found");
  }

  return payload;
}
