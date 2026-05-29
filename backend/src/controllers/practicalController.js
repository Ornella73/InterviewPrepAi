import { aiService } from "../services/aiService.js";
import { canUsePracticalExercise } from "../services/quotaService.js";

export const generatePractical = async (req, res) => {
  const { jobTitle, field, level } = req.body;

  if (!canUsePracticalExercise(req.user)) {
    return res.status(403).json({ message: "Practical exercises are a premium feature" });
  }

  const exercise = await aiService.generatePracticalExercise({ jobTitle, field, level });
  return res.json(exercise);
};
