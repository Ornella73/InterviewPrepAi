import InterviewSession from "../models/InterviewSession.js";
import CVAnalysis from "../models/CVAnalysis.js";
import { aiService } from "../services/aiService.js";
import {
  canUseSimulation,
  canUsePracticalExercise,
  incrementUsage
} from "../services/quotaService.js";

export const startInterview = async (req, res) => {
  const { jobTitle, field, level } = req.body;

  if (!jobTitle || !field || !level) {
    return res.status(400).json({ message: "jobTitle, field and level are required" });
  }

  if (!canUseSimulation(req.user)) {
    return res.status(403).json({ message: "Free plan limit reached for interview simulations" });
  }

  const latestCV = await CVAnalysis.findOne({ user: req.user._id }).sort({ createdAt: -1 });
  const generated = await aiService.generateInterviewQuestions({
    jobTitle,
    field,
    level,
    skills: latestCV?.extractedSkills || []
  });

  const practicalExercise = canUsePracticalExercise(req.user)
    ? await aiService.generatePracticalExercise({ jobTitle, field, level })
    : undefined;

  const session = await InterviewSession.create({
    user: req.user._id,
    jobTitle,
    field,
    level,
    cvAnalysis: latestCV?._id,
    questions: generated.questions,
    roleSummary: generated.roleSummary || "",
    questionThemes: generated.questionThemes || [],
    answers: generated.questions.map((question) => ({ question, answer: "", feedback: "" })),
    practicalExercise
  });

  await incrementUsage(req.user, "simulations");
  return res.status(201).json(session);
};

export const submitAnswer = async (req, res) => {
  const { answer } = req.body;

  const session = await InterviewSession.findOne({ _id: req.params.id, user: req.user._id });
  if (!session) {
    return res.status(404).json({ message: "Session not found" });
  }

  if (session.status === "completed") {
    return res.status(400).json({ message: "Session already completed" });
  }

  const idx = session.currentQuestionIndex;
  if (idx >= session.answers.length) {
    return res.status(400).json({ message: "No more questions" });
  }

  session.answers[idx].answer = answer || "";
  const evaluation = await aiService.evaluateInterviewAnswer({
    question: session.answers[idx].question,
    answer,
    jobTitle: session.jobTitle,
    field: session.field,
    level: session.level,
    skills: session.cvAnalysis ? (await CVAnalysis.findById(session.cvAnalysis).lean())?.extractedSkills || [] : []
  });
  session.answers[idx].analysis = {
    communication: evaluation.communication,
    clarity: evaluation.clarity,
    relevance: evaluation.relevance,
    confidence: evaluation.confidence,
    overall: evaluation.overall,
    summary: evaluation.summary || "",
    strengths: evaluation.strengths || [],
    improvementsNeeded: evaluation.improvementsNeeded || [],
    tips: evaluation.tips || []
  };
  session.answers[idx].feedback = evaluation.summary
    ? `${evaluation.summary} Score: ${evaluation.overall}/100`
    : `Score: ${evaluation.overall}/100`;

  if (idx < session.answers.length - 1) {
    session.currentQuestionIndex += 1;
  }

  await session.save();
  return res.json(session);
};

export const completeInterview = async (req, res) => {
  const session = await InterviewSession.findOne({ _id: req.params.id, user: req.user._id });
  if (!session) {
    return res.status(404).json({ message: "Session not found" });
  }

  const latestCV = session.cvAnalysis ? await CVAnalysis.findById(session.cvAnalysis).lean() : null;
  const report = await aiService.generateFinalReport({
    answers: session.answers,
    jobTitle: session.jobTitle,
    field: session.field,
    level: session.level,
    skills: latestCV?.extractedSkills || []
  });
  session.finalReport = report;
  session.status = "completed";
  await session.save();

  return res.json(session);
};

export const getInterview = async (req, res) => {
  const session = await InterviewSession.findOne({ _id: req.params.id, user: req.user._id });
  if (!session) {
    return res.status(404).json({ message: "Session not found" });
  }
  return res.json(session);
};

export const getInterviewHistory = async (req, res) => {
  const sessions = await InterviewSession.find({ user: req.user._id }).sort({ createdAt: -1 });
  return res.json(sessions);
};

export const deleteInterview = async (req, res) => {
  const session = await InterviewSession.findOne({ _id: req.params.id, user: req.user._id });
  if (!session) {
    return res.status(404).json({ message: "Session not found" });
  }

  await session.deleteOne();
  return res.json({ message: "Interview deleted" });
};
