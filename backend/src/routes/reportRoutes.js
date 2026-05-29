import express from "express";
import { downloadReportPdf, getReport } from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:sessionId", protect, getReport);
router.get("/:sessionId/pdf", protect, downloadReportPdf);

export default router;
