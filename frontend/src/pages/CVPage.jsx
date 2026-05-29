import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { notify } from "../utils/notify";

const CVPage = () => {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchHistory = async () => {
    const { data } = await api.get("/cv/history");
    setHistory(data);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        await fetchHistory();
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (!file) return;
    setError("");
    setSubmitting(true);

    const formData = new FormData();
    formData.append("cv", file);

    try {
      const { data } = await api.post("/cv/analyze", formData);
      setResult(data);
      setFile(null);
      await fetchHistory();
      notify("CV analysis completed", "success");
    } catch (err) {
      setError(err.response?.data?.message || "CV analysis failed");
      notify(err.response?.data?.message || "CV analysis failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteAnalysis = async (item) => {
    if (!window.confirm(`Delete analysis for ${item.fileName}?`)) return;
    try {
      await api.delete(`/cv/${item._id}`);
      await fetchHistory();
      if (result?._id === item._id) {
        setResult(null);
      }
      notify("Analysis deleted", "success");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete analysis");
      notify(err.response?.data?.message || "Unable to delete analysis", "error");
    }
  };

  const latestAnalysis = useMemo(() => result || history[0] || null, [result, history]);

  return (
    <div className="grid gap-lg">
      <section className="card hero-strip">
        <div>
          <p className="eyebrow">CV Insight</p>
          <h3>Upload a CV and get actionable feedback</h3>
          <p className="section-copy">
            We highlight structure, strengths, improvements, and the exact sentences that can be rewritten more professionally.
          </p>
        </div>
        <div className="chip-group">
          <span className="chip">Structure</span>
          <span className="chip">Impact</span>
          <span className="chip">Keywords</span>
          <span className="chip">Rewrite suggestions</span>
        </div>
      </section>

      <section className="card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Upload</p>
            <h3>Analyze a new CV</h3>
          </div>
        </div>
        <form className="inline-form" onSubmit={submit}>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Analyzing..." : "Analyze CV"}
          </button>
        </form>
        {file && <p className="muted">Selected file: {file.name}</p>}
        {error && <p className="error-text">{error}</p>}
      </section>

      {latestAnalysis && (
        <section className="card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Latest feedback</p>
              <h3>{latestAnalysis.fileName}</h3>
            </div>
            <span className="pill">{latestAnalysis.extractedSkills?.length || 0} skills detected</span>
          </div>
          <p>{latestAnalysis.summary}</p>
          <div className="report-grid">
            <div className="card-inner">
              <h4>Strengths</h4>
              <ul className="compact-list">
                {latestAnalysis.strengths?.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="card-inner">
              <h4>Improvement areas</h4>
              <ul className="compact-list">
                {latestAnalysis.improvements?.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="card-inner">
              <h4>Skills</h4>
              <div className="chip-group">
                {latestAnalysis.extractedSkills?.map((skill) => (
                  <span key={skill} className="chip">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {latestAnalysis.improvedSentences?.length > 0 && (
            <div className="card-inner">
              <h4>Rewrite suggestions</h4>
              <div className="stack">
                {latestAnalysis.improvedSentences.map((line, idx) => (
                  <div className="rewrite-card" key={`${line.original}-${idx}`}>
                    <p className="muted">Original</p>
                    <p>{line.original}</p>
                    <p className="muted">Improved</p>
                    <p>{line.improved}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="card">
        <div className="section-head">
          <div>
            <p className="eyebrow">History</p>
            <h3>Previous analyses</h3>
          </div>
        </div>
        {loading && <p className="muted">Loading history...</p>}
        {!loading && history.length === 0 && (
          <div className="empty-state">
            <p>No CV analysis yet.</p>
            <span className="muted">Upload a PDF, DOCX, or TXT file to generate your first review.</span>
          </div>
        )}
        {history.map((item) => (
          <div className="item-row" key={item._id}>
            <div className="answer-score-row">
              <strong>{item.fileName}</strong>
              <span className="pill">{(item.extractedSkills || []).length} skills</span>
            </div>
            <p>{item.summary}</p>
            <div className="row-actions">
              <button className="btn-secondary" onClick={() => setResult(item)}>
                View
              </button>
              <button className="btn-secondary" onClick={() => deleteAnalysis(item)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default CVPage;
