import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const load = async () => {
    const { data } = await api.get("/interviews/history");
    setHistory(data);
    if (!selectedId && data[0]?._id) {
      setSelectedId(data[0]._id);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredHistory = useMemo(() => {
    return history.filter((session) => {
      const matchesQuery =
        `${session.jobTitle} ${session.field} ${session.level}`.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "all" ? true : session.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [history, query, statusFilter]);

  const selectedSession = filteredHistory.find((session) => session._id === selectedId) || filteredHistory[0] || null;

  const deleteSession = async (session) => {
    if (!window.confirm(`Delete interview session for ${session.jobTitle}?`)) return;
    try {
      await api.delete(`/interviews/${session._id}`);
      await load();
      if (selectedId === session._id) {
        setSelectedId(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete session");
    }
  };

  return (
    <div className="dashboard-split">
      <section className="card">
        <div className="section-head">
          <div>
            <p className="eyebrow">History</p>
            <h3>Previous simulations</h3>
          </div>
        </div>
        <div className="inline-form">
          <input placeholder="Search job, field, or level" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        {error && <p className="error-text">{error}</p>}
        {filteredHistory.length === 0 && <div className="empty-state">No matching sessions.</div>}
        {filteredHistory.map((session) => (
          <article
            key={session._id}
            className={`item-row ${selectedSession?._id === session._id ? "item-row-active" : ""}`}
            onClick={() => setSelectedId(session._id)}
          >
            <div className="answer-score-row">
              <strong>{session.jobTitle}</strong>
              {session.finalReport?.overall != null && <span className="pill">{session.finalReport.overall}/100</span>}
            </div>
            <p className="muted">
              {session.field} | {session.level} | {session.status}
            </p>
            <div className="row-actions">
              {session.status === "in_progress" && (
                <button
                  className="btn-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/app/interview", { state: { resumeSessionId: session._id } });
                  }}
                >
                  Resume
                </button>
              )}
              <button
                className="btn-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(session._id);
                }}
              >
                View
              </button>
              <button
                className="btn-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSession(session);
                }}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </section>

      <aside className="card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Details</p>
            <h3>{selectedSession?.jobTitle || "Select a session"}</h3>
          </div>
        </div>
        {!selectedSession ? (
          <div className="empty-state">Pick a session on the left to inspect its report and answers.</div>
        ) : (
          <div className="stack">
            <div className="card-inner">
              <p className="muted">
                {selectedSession.field} | {selectedSession.level}
              </p>
              <p>{selectedSession.status}</p>
            </div>

            {selectedSession.finalReport && (
              <div className="card-inner">
                <p className="eyebrow">Summary</p>
                <p>{selectedSession.finalReport.summary}</p>
                <div className="stats-grid">
                  <article className="mini-card"><p>Communication</p><h4>{selectedSession.finalReport.communication}</h4></article>
                  <article className="mini-card"><p>Clarity</p><h4>{selectedSession.finalReport.clarity}</h4></article>
                  <article className="mini-card"><p>Relevance</p><h4>{selectedSession.finalReport.relevance}</h4></article>
                  <article className="mini-card"><p>Confidence</p><h4>{selectedSession.finalReport.confidence}</h4></article>
                </div>
              </div>
            )}

            <div className="card-inner">
              <h4>Questions</h4>
              <div className="stack">
                {selectedSession.answers?.map((answer, index) => (
                  <div className="rewrite-card" key={`${selectedSession._id}-${index}`}>
                    <p className="muted">Q{index + 1}</p>
                    <p>{answer.question}</p>
                    <p className="muted">Answer</p>
                    <p>{answer.answer || "No answer yet."}</p>
                    {answer.analysis?.overall ? (
                      <div className="chip-group">
                        <span className="chip">{answer.analysis.overall}/100</span>
                        <span className="chip">Clarity {answer.analysis.clarity}</span>
                        <span className="chip">Relevance {answer.analysis.relevance}</span>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

export default HistoryPage;
