import mongoose from "mongoose";

const motivationLetterSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    source: { type: String, enum: ["generated", "uploaded"], required: true },
    jobTitle: { type: String },
    content: { type: String, required: true },
    revisedContent: { type: String, default: "" },
    summary: { type: String, default: "" },
    grammarCorrections: [{ type: String }],
    styleSuggestions: [{ type: String }]
  },
  { timestamps: true }
);

const MotivationLetter = mongoose.model("MotivationLetter", motivationLetterSchema);
export default MotivationLetter;
