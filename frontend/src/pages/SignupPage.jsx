import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const benefits = [
  "Generate role-specific interview questions",
  "Get structured feedback on answers",
  "Create cleaner motivation letters",
  "Keep a professional history of your sessions"
];

const SignupPage = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(form);
      navigate("/app");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card auth-grid" onSubmit={onSubmit}>
        <div>
          <p className="eyebrow">Create account</p>
          <h1>Start free</h1>
          <p className="muted">A simple setup to prepare better interviews and cleaner application documents.</p>
        </div>
        <div className="feature-panel">
          {benefits.map((item) => (
            <div key={item} className="item-row">
              <strong>{item}</strong>
            </div>
          ))}
        </div>
        {error && <p className="error-text">{error}</p>}
        <input
          type="text"
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Creating..." : "Sign up"}
        </button>
        <p className="muted">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default SignupPage;
