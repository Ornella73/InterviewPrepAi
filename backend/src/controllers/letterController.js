import fs from "fs/promises";
import PDFDocument from "pdfkit";
import MotivationLetter from "../models/MotivationLetter.js";
import CVAnalysis from "../models/CVAnalysis.js";
import { aiService } from "../services/aiService.js";

export const generateLetter = async (req, res) => {
  const { jobTitle } = req.body;

  if (!jobTitle) {
    return res.status(400).json({ message: "jobTitle is required" });
  }

  const latestCV = await CVAnalysis.findOne({ user: req.user._id }).sort({ createdAt: -1 });
  const generated = await aiService.generateMotivationLetter({
    name: req.user.name,
    jobTitle,
    field: "",
    cvSummary: latestCV?.summary || "",
    strengths: latestCV?.strengths || latestCV?.extractedSkills || []
  });

  const record = await MotivationLetter.create({
    user: req.user._id,
    source: "generated",
    jobTitle,
    content: generated.content,
    revisedContent: generated.content,
    summary: generated.subject || "",
    grammarCorrections: [],
    styleSuggestions: []
  });

  return res.status(201).json(record);
};

export const uploadAndReviewLetter = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Letter file is required" });
  }

  const content = await fs.readFile(req.file.path, "utf8").catch(() => "Could not parse content from this format.");
  const review = await aiService.reviewMotivationLetter({ content });

  const record = await MotivationLetter.create({
    user: req.user._id,
    source: "uploaded",
    content,
    revisedContent: review.revisedContent || "",
    summary: review.summary || "",
    grammarCorrections: review.grammarCorrections,
    styleSuggestions: review.styleSuggestions
  });

  return res.status(201).json(record);
};

export const getLetterHistory = async (req, res) => {
  const list = await MotivationLetter.find({ user: req.user._id }).sort({ createdAt: -1 });
  return res.json(list);
};

export const deleteLetter = async (req, res) => {
  const record = await MotivationLetter.findOne({ _id: req.params.id, user: req.user._id });
  if (!record) {
    return res.status(404).json({ message: "Letter not found" });
  }

  await record.deleteOne();
  return res.json({ message: "Letter deleted" });
};

export const downloadLetterPdf = async (req, res) => {
  const record = await MotivationLetter.findOne({ _id: req.params.id, user: req.user._id });
  if (!record) {
    return res.status(404).json({ message: "Letter not found" });
  }

  const doc = new PDFDocument({ margin: 48 });
  const filename = `motivation-letter-${record._id}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

  doc.pipe(res);
  doc.fontSize(18).text("InterviewPrep AI - Motivation Letter");
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Role: ${record.jobTitle || "N/A"}`);
  doc.text(`Source: ${record.source}`);
  if (record.summary) {
    doc.moveDown();
    doc.fontSize(11).text(record.summary);
  }
  doc.moveDown();
  doc.fontSize(11).text(record.revisedContent || record.content);
  doc.end();
};
