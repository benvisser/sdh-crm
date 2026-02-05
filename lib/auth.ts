import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { type User } from "@prisma/client";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-do-not-use-in-production"
);

const COOKIE_NAME = "auth-token";
const TOKEN_EXPIRY = "7d";

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export type SafeUser = Omit<User, "passwordHash">;

export async function createToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(TOKEN_EXPIRY)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  return cookie?.value || null;
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const token = await getAuthToken();
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user || !user.isActive) return null;

  return user as SafeUser;
}

export async function requireAuth(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function getTokenFromRequest(
  request: Request
): Promise<JWTPayload | null> {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = Object.fromEntries(
    cookieHeader.split("; ").map((c) => {
      const [key, ...val] = c.split("=");
      return [key, val.join("=")];
    })
  );

  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  return verifyToken(token);
}

export async function requireAuthFromRequest(
  request: Request
): Promise<JWTPayload> {
  const payload = await getTokenFromRequest(request);
  if (!payload) {
    throw new Error("Unauthorized");
  }
  return payload;
}
