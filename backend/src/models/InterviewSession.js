import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, default: "" },
    feedback: { type: String, default: "" },
    analysis: {
      communication: { type: Number, default: 0 },
      clarity: { type: Number, default: 0 },
      relevance: { type: Number, default: 0 },
      confidence: { type: Number, default: 0 },
      overall: { type: Number, default: 0 },
      summary: { type: String, default: "" },
      strengths: [{ type: String }],
      improvementsNeeded: [{ type: String }],
      tips: [{ type: String }]
    }
  },
  { _id: false }
);

const interviewSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    jobTitle: { type: String, required: true },
    field: { type: String, required: true },
    level: { type: String, required: true },
    cvAnalysis: { type: mongoose.Schema.Types.ObjectId, ref: "CVAnalysis" },
    questions: [{ type: String }],
    answers: [answerSchema],
    currentQuestionIndex: { type: Number, default: 0 },
    roleSummary: { type: String, default: "" },
    questionThemes: [{ type: String }],
    practicalExercise: {
      title: String,
      prompt: String,
      expectedOutcome: String
    },
    finalReport: {
      communication: Number,
      clarity: Number,
      relevance: Number,
      confidence: Number,
      overall: Number,
      summary: String,
      strengths: [String],
      improvementsNeeded: [String],
      tips: [String]
    },
    status: { type: String, enum: ["in_progress", "completed"], default: "in_progress" }
  },
  { timestamps: true }
);

const InterviewSession = mongoose.model("InterviewSession", interviewSessionSchema);
export default InterviewSession;
