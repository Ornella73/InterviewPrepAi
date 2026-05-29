import express from "express";
import { analyzeCV, deleteCVAnalysis, getCVHistory } from "../controllers/cvController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/analyze", protect, upload.single("cv"), analyzeCV);
router.get("/history", protect, getCVHistory);
router.delete("/:id", protect, deleteCVAnalysis);

export default router;
