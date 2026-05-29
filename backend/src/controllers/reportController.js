import PDFDocument from "pdfkit";
import InterviewSession from "../models/InterviewSession.js";

export const getReport = async (req, res) => {
  const session = await InterviewSession.findOne({ _id: req.params.sessionId, user: req.user._id });

  if (!session || session.status !== "completed") {
    return res.status(404).json({ message: "Completed report not found" });
  }

  return res.json(session.finalReport);
};

export const downloadReportPdf = async (req, res) => {
  if (req.user.plan !== "premium") {
    return res.status(403).json({ message: "PDF download is a premium feature" });
  }

  const session = await InterviewSession.findOne({ _id: req.params.sessionId, user: req.user._id });

  if (!session || session.status !== "completed") {
    return res.status(404).json({ message: "Completed report not found" });
  }

  const { finalReport } = session;
  const doc = new PDFDocument();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=report-${session._id}.pdf`);

  doc.pipe(res);
  doc.fontSize(18).text("InterviewPrep AI - Final Report");
  doc.moveDown();
  doc.fontSize(12).text(`Role: ${session.jobTitle} (${session.field}, ${session.level})`);
  doc.text(`Communication: ${finalReport.communication}`);
  doc.text(`Clarity: ${finalReport.clarity}`);
  doc.text(`Relevance: ${finalReport.relevance}`);
  doc.text(`Confidence: ${finalReport.confidence}`);
  doc.moveDown();

  doc.text("Strengths:");
  finalReport.strengths.forEach((item) => doc.text(`- ${item}`));
  doc.moveDown();

  doc.text("Improvements:");
  finalReport.improvementsNeeded.forEach((item) => doc.text(`- ${item}`));
  doc.moveDown();

  doc.text("Tips:");
  finalReport.tips.forEach((item) => doc.text(`- ${item}`));

  doc.end();
};
