import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createCheckoutSession,
  getBillingStatus,
  verifyCheckoutSession
} from "../controllers/billingController.js";

const router = express.Router();

router.post("/checkout-session", protect, createCheckoutSession);
router.get("/status", protect, getBillingStatus);
router.get("/verify-session", protect, verifyCheckoutSession);

export default router;
