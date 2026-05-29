import express from "express";
import {
  deleteInterview,
  completeInterview,
  getInterview,
  getInterviewHistory,
  startInterview,
  submitAnswer
} from "../controllers/interviewController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/start", protect, startInterview);
router.post("/:id/answer", protect, submitAnswer);
router.post("/:id/complete", protect, completeInterview);
router.get("/history", protect, getInterviewHistory);
router.get("/:id", protect, getInterview);
router.delete("/:id", protect, deleteInterview);

export default router;
