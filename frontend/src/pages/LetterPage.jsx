import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { notify } from "../utils/notify";

const LetterPage = () => {
  const [jobTitle, setJobTitle] = useState("");
  const [file, setFile] = useState(null);
  const [generated, setGenerated] = useState(null);
  const [reviewed, setReviewed] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadHistory = async () => {
    const { data } = await api.get("/letters/history");
    setHistory(data);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        await loadHistory();
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const generate = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post("/letters/generate", { jobTitle });
      setGenerated(data);
      setReviewed(null);
      await loadHistory();
      notify("Motivation letter generated", "success");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to generate the letter");
      notify(err.response?.data?.message || "Unable to generate the letter", "error");
    } finally {
      setBusy(false);
    }
  };

  const review = async (event) => {
    event.preventDefault();
    if (!file) return;
    setError("");
    setBusy(true);
    const formData = new FormData();
    formData.append("letter", file);
    try {
      const { data } = await api.post("/letters/review", formData);
      setReviewed(data);
      setGenerated(null);
      await loadHistory();
      notify("Letter review completed", "success");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to review the letter");
      notify(err.response?.data?.message || "Unable to review the letter", "error");
    } finally {
      setBusy(false);
    }
  };

  const activeLetter = useMemo(() => generated || reviewed || history[0] || null, [generated, reviewed, history]);

  const copyText = async (text) => {
    await navigator.clipboard.writeText(text);
    notify("Copied to clipboard", "success");
  };

  const downloadText = (text, filename) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    notify("File downloaded", "success");
  };

  const deleteLetter = async (item) => {
    if (!window.confirm(`Delete letter for ${item.jobTitle || "this entry"}?`)) return;
    try {
      await api.delete(`/letters/${item._id}`);
      await loadHistory();
      if (generated?._id === item._id) setGenerated(null);
      if (reviewed?._id === item._id) setReviewed(null);
      notify("Letter deleted", "success");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete the letter");
      notify(err.response?.data?.message || "Unable to delete the letter", "error");
    }
  };

  const downloadPdf = async (item) => {
    try {
      const response = await api.get(`/letters/${item._id}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `motivation-letter-${item._id}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      notify("PDF downloaded", "success");
    } catch (err) {
      notify(err.response?.data?.message || "Unable to download PDF", "error");
    }
  };

  return (
    <div className="grid gap-lg">
      <section className="card hero-strip">
        <div>
          <p className="eyebrow">Letter Studio</p>
          <h3>Generate or refine a professional motivation letter</h3>
          <p className="section-copy">
            Build a letter that reads like a real application document, not a generic template.
          </p>
        </div>
        <div className="chip-group">
          <span className="chip">Formal structure</span>
          <span className="chip">Concrete achievements</span>
          <span className="chip">Company fit</span>
        </div>
      </section>

      <section className="dashboard-split">
        <section className="card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Generate</p>
              <h3>Create a new letter</h3>
            </div>
          </div>
          <form className="inline-form" onSubmit={generate}>
            <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Job title" required />
            <button className="btn-primary" type="submit" disabled={busy}>
              {busy ? "Working..." : "Generate"}
            </button>
          </form>
        </section>

        <section className="card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Review</p>
              <h3>Improve an existing letter</h3>
            </div>
          </div>
          <form className="inline-form" onSubmit={review}>
            <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <button className="btn-primary" type="submit" disabled={busy}>
              {busy ? "Working..." : "Review"}
            </button>
          </form>
          {file && <p className="muted">Selected file: {file.name}</p>}
        </section>
      </section>

      {error && <p className="error-text">{error}</p>}

      {activeLetter && (
        <section className="card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Latest output</p>
              <h3>{activeLetter.jobTitle || activeLetter.summary || "Letter"}</h3>
            </div>
            <div className="row-actions">
              <button className="btn-secondary" onClick={() => copyText(activeLetter.revisedContent || activeLetter.content)}>
                Copy
              </button>
              <button
                className="btn-secondary"
                onClick={() => downloadText(activeLetter.revisedContent || activeLetter.content, "motivation-letter.txt")}
              >
                Download
              </button>
              {activeLetter._id && (
                <button className="btn-secondary" onClick={() => downloadPdf(activeLetter)}>
                  PDF
                </button>
              )}
            </div>
          </div>

          <div className="report-grid">
            <div className="card-inner">
              <p className="eyebrow">Context</p>
              <p>{activeLetter.summary || "Professional motivation letter"}</p>
              <div className="chip-group">
                <span className="chip">{activeLetter.source}</span>
                {activeLetter.jobTitle && <span className="chip">{activeLetter.jobTitle}</span>}
              </div>
            </div>
            <div className="card-inner">
              <p className="eyebrow">Editable version</p>
              <pre className="content-box structured-letter">
                {activeLetter.revisedContent || activeLetter.content}
              </pre>
            </div>
          </div>
        </section>
      )}

      <section className="card">
        <div className="section-head">
          <div>
            <p className="eyebrow">History</p>
            <h3>Previous letters</h3>
          </div>
        </div>
        {loading && <p className="muted">Loading history...</p>}
        {!loading && history.length === 0 && (
          <div className="empty-state">
            <p>No letter yet.</p>
            <span className="muted">Generate one or upload a file to begin.</span>
          </div>
        )}
        {history.map((item) => (
          <div className="item-row" key={item._id}>
            <div className="answer-score-row">
              <strong>{item.jobTitle || item.source}</strong>
              <span className="pill">{item.source}</span>
            </div>
            <p className="muted">{item.summary || "Letter saved in your history"}</p>
            <p>{(item.revisedContent || item.content || "").slice(0, 180)}...</p>
            <div className="row-actions">
              <button className="btn-secondary" onClick={() => setGenerated(item)}>
                View
              </button>
              <button className="btn-secondary" onClick={() => downloadPdf(item)}>
                PDF
              </button>
              <button className="btn-secondary" onClick={() => deleteLetter(item)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default LetterPage;
