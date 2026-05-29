import User from "../models/User.js";

export const getUsers = async (_req, res) => {
  const users = await User.find({}).select("name email role isActive plan usage createdAt").sort({ createdAt: -1 });
  return res.json(users);
};

export const updateUserAccess = async (req, res) => {
  const { plan, isActive } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (typeof isActive === "boolean") {
    user.isActive = isActive;
  }

  if (plan) {
    if (!["free", "premium"].includes(plan)) {
      return res.status(400).json({ message: "Invalid plan value" });
    }
    user.plan = plan;
  }

  await user.save();

  return res.json({
    message: "User access updated",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      plan: user.plan,
      usage: user.usage
    }
  });
};
