import express from "express";
import {
  deleteLetter,
  downloadLetterPdf,
  generateLetter,
  getLetterHistory,
  uploadAndReviewLetter
} from "../controllers/letterController.js";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/generate", protect, generateLetter);
router.post("/review", protect, upload.single("letter"), uploadAndReviewLetter);
router.get("/history", protect, getLetterHistory);
router.delete("/:id", protect, deleteLetter);
router.get("/:id/pdf", protect, downloadLetterPdf);

export default router;
