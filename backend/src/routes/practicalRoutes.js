import express from "express";
import { generatePractical } from "../controllers/practicalController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/generate", protect, generatePractical);

export default router;
