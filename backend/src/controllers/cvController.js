import CVAnalysis from "../models/CVAnalysis.js";
import { aiService } from "../services/aiService.js";
import { canUseCVAnalysis, incrementUsage } from "../services/quotaService.js";
import { extractTextFromUpload } from "../services/fileService.js";
import fs from "fs/promises";

export const analyzeCV = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "CV file is required" });
  }

  if (!canUseCVAnalysis(req.user)) {
    return res.status(403).json({ message: "Free plan limit reached for CV analysis" });
  }

  const rawText = await extractTextFromUpload(req.file);
  const analysis = await aiService.analyzeCV({ fileName: req.file.originalname, rawText });

  const record = await CVAnalysis.create({
    user: req.user._id,
    fileName: req.file.originalname,
    filePath: req.file.path,
    summary: analysis.summary,
    strengths: analysis.strengths,
    improvementsNeeded: analysis.improvementsNeeded,
    improvements: analysis.improvements,
    improvedSentences: analysis.improvedSentences,
    extractedSkills: analysis.extractedSkills
  });

  await incrementUsage(req.user, "cvAnalyses");
  return res.status(201).json(record);
};

export const getCVHistory = async (req, res) => {
  const list = await CVAnalysis.find({ user: req.user._id }).sort({ createdAt: -1 });
  return res.json(list);
};

export const deleteCVAnalysis = async (req, res) => {
  const record = await CVAnalysis.findOne({ _id: req.params.id, user: req.user._id });
  if (!record) {
    return res.status(404).json({ message: "Analysis not found" });
  }

  if (record.filePath) {
    await fs.unlink(record.filePath).catch(() => {});
  }

  await record.deleteOne();
  return res.json({ message: "Analysis deleted" });
};
