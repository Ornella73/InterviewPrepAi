import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isActive: { type: Boolean, default: true },
    plan: { type: String, enum: ["free", "premium"], default: "free" },
    stripeCustomerId: { type: String, default: null },
    usage: {
      cvAnalyses: { type: Number, default: 0 },
      simulations: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
