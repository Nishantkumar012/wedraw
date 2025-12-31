import {Router} from 'express'
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../authmiddleware/auth.js";
import { Role } from "../../generated/prisma/enums";



const router = Router();



router.post("/grant-editor", authMiddleware, async (req, res) => {
  const { boardId, userId } = req.body;
  const requesterId = req.userId!;

  if (!boardId || !userId) {
    return res.status(400).json({ error: "boardId and userId required" });
  }

  try {
    // Ensure requester is OWNER
    const ownerPermission = await prisma.permission.findFirst({
      where: {
        userId: requesterId,
        boardId,
        role: Role.OWNER
      }
    });

    if (!ownerPermission) {
      return res.status(403).json({ error: "Only owner can grant access" });
    }

    // Prevent duplicate permission
    const existing = await prisma.permission.findFirst({
      where: { userId, boardId }
    });

    if (existing) {
      return res.json({ message: "User already has permission" });
    }

    const permission = await prisma.permission.create({
      data: {
        userId,
        boardId,
        role: Role.EDITOR
      }
    });

    res.json({
      message: "EDITOR access granted",
      permission
    });

  } catch (err) {
    console.error("Grant editor error", err);
    res.status(500).json({ error: "Failed to grant permission" });
  }
});


export default router