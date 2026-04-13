import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../authmiddleware/auth.js";
import { Role } from "../../generated/prisma/enums";

const router = Router();

/**
 * 🔹 Health Check
 */
router.get("/health", (req, res) => {
  res.json({ ok: true, message: "Boards API working" });
});


/**
 * 🔹 Create Board (protected)
 */
router.post("/", authMiddleware, async (req, res) => {
  const { title } = req.body;
  const userId = req.userId;

  if (!title) return res.status(400).json({ error: "Title is required" });

  try {
    const board = await prisma.board.create({
      data: {
        title,
        ownerId: userId!,
        permissions: {
          create: [
            {
              userId: userId!,
              role: Role.OWNER
            }
          ]
        }
      }
    });

    res.json(board);
  } catch (error) {
    console.error("Error creating board", error);
    res.status(500).json({ error: "Failed to create board" });
  }
});


// get all the shapes
router.get("/:boardId/elements", authMiddleware, async (req, res) => {

  const { boardId } = req.params;
  const userId = req.userId;

  // console.log("I am in elements fetching routes");
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const permission = await prisma.permission.findFirst({
      where: {
        boardId,
        userId
      }
    })

    if (!permission) {
      return res.status(403).json({ error: "Access denied" });
    }

    const elements = await prisma.element.findMany({
      where: { boardId },
      orderBy: { createdAt: "asc" }
    })
    res.json(elements);
  } catch (error) {
    console.error("Failed to fetch elements", error);
    res.status(500).json({ error: "Failed to fetch elements" });
  }
})




/**
 * 🔹 List Boards user has access to
 */
router.get("/me", authMiddleware, async (req, res) => {
  const userId = req.userId!;

  try {
    const permissions = await prisma.permission.findMany({
      where: { userId },
      include: { board: true }
    });
     
    // console.log(permissions);

    // res.json(permissions.map(p => p.board));
    // console.log(permissions);
    res.json(permissions)
  } catch (error) {
    console.error("Error fetching boards", error);
    res.status(500).json({ error: "Failed to fetch boards" });
  }
});



/**
 * 🔹 Get a specific board (protected + permission check)
 */
router.get("/:boardId", authMiddleware, async (req, res) => {
  const { boardId } = req.params;
  const userId = req.userId!;

  try {
    const permission = await prisma.permission.findFirst({
      where: { userId, boardId }
    });

    if (!permission) {
      return res.status(403).json({ error: "Access denied" });
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: { elements: true }
    });

    if (!board) return res.status(404).json({ error: "Board not found" });

    res.json(board);
  } catch (error) {
    console.error("Error fetching board", error);
    res.status(500).json({ error: "Failed to get board" });
  }
});



/**
 * 🔹 Update Board Meta (only Owner)
 */
router.patch("/:boardId", authMiddleware, async (req, res) => {
  const { boardId } = req.params;
  const { title } = req.body;
  const userId = req.userId!;

  try {
    // Ensure only owner can update
    const perm = await prisma.permission.findFirst({
      where: { userId, boardId, role: Role.OWNER }
    });

    if (!perm) return res.status(403).json({ error: "Only owner can update board" });

    const board = await prisma.board.update({
      where: { id: boardId },
      data: { title }
    });

    res.json(board);
  } catch (error) {
    console.error("Error updating board", error);
    res.status(500).json({ error: "Failed to update board" });
  }
});




/**
 * 🔹 Create Element in Board (protected)
 */
router.post("/:boardId/elements", authMiddleware, async (req, res) => {
  const { boardId } = req.params;
  const { type, data } = req.body;
  const userId = req.userId!;

  if (!type || !data) {
    return res.status(400).json({ error: "type & data are required" });
  }

  try {
    // 🚫 Ensure user has access to the board
    const permission = await prisma.permission.findFirst({
      where: { userId, boardId }
    });

    if (!permission) return res.status(403).json({ error: "No access to this board" });

    const element = await prisma.element.create({
      data: {
        boardId,
        type: type.toUpperCase(),
        data
      }
    });

    res.json(element);
  } catch (error) {
    console.error("Error creating element", error);
    res.status(500).json({ error: "Failed to create element" });
  }
});



/**
 * 🔹 Invite user to board (OWNER only)
 */



router.post("/:boardId/invite", authMiddleware, async (req, res) => {
  try {
    const { boardId } = req.params;
    const { email, role } = req.body;
    const ownerId = req.userId!;

    // -------------------------
    // 1️⃣ Basic validation
    // -------------------------
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    if (!role) {
      return res.status(400).json({ error: "Role is required" });
    }

    // normalize role
    const normalizedRole = role.trim().toUpperCase();

    // -------------------------
    // 2️⃣ Check board exists
    // -------------------------
    const board = await prisma.board.findUnique({
      where: { id: boardId }
    });

    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }

    // -------------------------
    // 3️⃣ Check owner access
    // -------------------------
    const ownerPermission = await prisma.permission.findUnique({
      where: {
        userId_boardId: {
          userId: ownerId,
          boardId
        }
      }
    });

    const isOwner =
      board.ownerId === ownerId ||
      ownerPermission?.role === Role.OWNER;

    if (!isOwner) {
      return res.status(403).json({
        error: "Only owner can invite users"
      });
    }

    // -------------------------
    // 4️⃣ Validate role
    // -------------------------
    if (!Object.values(Role).includes(normalizedRole)) {
      return res.status(400).json({
        error: "Invalid role"
      });
    }

    if (normalizedRole === Role.OWNER) {
      return res.status(403).json({
        error: "Cannot assign OWNER role"
      });
    }

    const safeRole = normalizedRole as Role;

    // -------------------------
    // 5️⃣ Find user
    // -------------------------
    const userToInvite = await prisma.user.findUnique({
      where: { email }
    });

    if (!userToInvite) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    // -------------------------
    // 6️⃣ Prevent duplicate
    // -------------------------
    const existingPermission = await prisma.permission.findUnique({
      where: {
        userId_boardId: {
          userId: userToInvite.id,
          boardId
        }
      }
    });

    if (existingPermission) {
      return res.json({
        message: "User already has access"
      });
    }

    // -------------------------
    // 7️⃣ Create permission
    // -------------------------
    const permission = await prisma.permission.create({
      data: {
        boardId,
        userId: userToInvite.id,
        role: safeRole
      }
    });

    // -------------------------
    // ✅ Response
    // -------------------------
    return res.json({
      message: "User invited successfully",
      permission
    });

  } catch (error) {
    console.error("Invite error:", error);
    return res.status(500).json({
      error: "Failed to invite user"
    });
  }
});






export default router;
