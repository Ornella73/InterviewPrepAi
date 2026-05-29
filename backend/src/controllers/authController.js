import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { generateToken } from "../utils/jwt.js";

const getAdminEmails = () =>
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

const normalizeEmail = (email) => (typeof email === "string" ? email.trim().toLowerCase() : "");

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive !== false,
  plan: user.plan,
  usage: user.usage
});

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const normalizedName = typeof name === "string" ? name.trim() : "";

  if (!normalizedName || !normalizedEmail || !password) {
    return res.status(400).json({ message: "Name, email and password are required" });
  }

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({ message: "Email already used" });
  }

  const hashed = await bcrypt.hash(password, 10);
  const role = getAdminEmails().includes(normalizedEmail) ? "admin" : "user";
  const user = await User.create({ name: normalizedName, email: normalizedEmail, password: hashed, role });

  return res.status(201).json({
    token: generateToken(user._id),
    user: serializeUser(user)
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (user.isActive === false) {
    return res.status(403).json({ message: "Account is deactivated. Contact an admin." });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  return res.json({
    token: generateToken(user._id),
    user: serializeUser(user)
  });
};

export const me = async (req, res) => {
  return res.json({ user: req.user });
};
