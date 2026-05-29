import { useState } from "react";
import api from "../api/client";
import { notify } from "../utils/notify";

const templates = [
  { label: "Frontend", field: "IT", jobTitle: "Frontend Developer", level: "junior" },
  { label: "Backend", field: "IT", jobTitle: "Backend Engineer", level: "junior" },
  { label: "Product", field: "IT", jobTitle: "Product Manager", level: "senior" },
  { label: "Design", field: "design", jobTitle: "UX Designer", level: "junior" }
];

const PracticalPage = () => {
  const [payload, setPayload] = useState({ jobTitle: "Software Engineer", field: "IT", level: "junior" });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/practical/generate", payload);
      setResult(data);
      notify("Practical exercise generated", "success");
    } catch (err) {
      setError(err.response?.data?.message || "Could not generate practical exercise");
      notify(err.response?.data?.message || "Could not generate practical exercise", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-lg">
      <section className="card hero-strip">
        <div>
          <p className="eyebrow">Practical exercise</p>
          <h3>Train with a realistic job case</h3>
          <p className="section-copy">
            Generate a scenario that matches the role, the field, and the expected seniority.
          </p>
        </div>
        <div className="chip-group">
          <span className="chip">Scenario</span>
          <span className="chip">Decision-making</span>
          <span className="chip">Execution</span>
        </div>
      </section>

      <section className="card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Configuration</p>
            <h3>Customize the exercise</h3>
          </div>
        </div>
        <div className="chip-group">
          {templates.map((template) => (
            <button
              key={template.label}
              type="button"
              className="chip chip-button"
              onClick={() => setPayload(template)}
            >
              {template.label}
            </button>
          ))}
        </div>

        <form className="inline-form" onSubmit={generate}>
          <input
            value={payload.jobTitle}
            onChange={(e) => setPayload({ ...payload, jobTitle: e.target.value })}
            placeholder="Job title"
          />
          <select value={payload.field} onChange={(e) => setPayload({ ...payload, field: e.target.value })}>
            <option>IT</option>
            <option>cybersecurity</option>
            <option>marketing</option>
            <option>design</option>
            <option>finance</option>
            <option>data</option>
          </select>
          <select value={payload.level} onChange={(e) => setPayload({ ...payload, level: e.target.value })}>
            <option>internship</option>
            <option>junior</option>
            <option>senior</option>
          </select>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Generating..." : "Generate"}
          </button>
        </form>
        {error && <p className="error-text">{error}</p>}
      </section>

      {result && (
        <section className="card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Result</p>
              <h3>{result.title}</h3>
            </div>
            <span className="pill">Role matched</span>
          </div>
          <p>{result.prompt}</p>
          <div className="card-inner">
            <p className="eyebrow">Expected outcome</p>
            <p>{result.expectedOutcome}</p>
          </div>
        </section>
      )}
    </div>
  );
};

export default PracticalPage;
