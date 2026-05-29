import express from "express";
import { getUsers, updateUserAccess } from "../controllers/adminController.js";
import { protect, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/users", protect, requireAdmin, getUsers);
router.patch("/users/:id/access", protect, requireAdmin, updateUserAccess);

export default router;
