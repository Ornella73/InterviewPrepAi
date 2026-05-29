import mongoose from "mongoose";

const cvAnalysisSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    summary: { type: String, required: true },
    strengths: [{ type: String }],
    improvementsNeeded: { type: Boolean, default: false },
    improvements: [{ type: String }],
    improvedSentences: [
      {
        original: String,
        improved: String
      }
    ],
    extractedSkills: [{ type: String }]
  },
  { timestamps: true }
);

const CVAnalysis = mongoose.model("CVAnalysis", cvAnalysisSchema);
export default CVAnalysis;
