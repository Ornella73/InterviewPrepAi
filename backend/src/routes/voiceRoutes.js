import { Router } from "express";
import { createRealtimeSession, speakText, transcribeAudio } from "../controllers/voiceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/transcribe", transcribeAudio);
router.post("/speak", speakText);
router.post("/realtime/session", protect, createRealtimeSession);

export default router;
