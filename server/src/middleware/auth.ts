import type { NextFunction, Request, Response } from "express";
import { adminAuth } from "../lib/firebase-admin.js";
import { prisma } from "../lib/prisma.js";

export type AuthUser = {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const token = header.slice("Bearer ".length).trim();
    const decoded = await adminAuth.verifyIdToken(token);
    const profile = {
      email: decoded.email ?? "",
      displayName: decoded.name ?? null,
      photoURL: decoded.picture ?? null,
    };

    await prisma.user.upsert({
      where: { id: decoded.uid },
      create: { id: decoded.uid, ...profile },
      update: profile,
    });

    req.user = { uid: decoded.uid, ...profile };
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}
