import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { notify } from "../utils/notify";

const quickActions = [
  { to: "/app/cv", label: "Analyze CV", description: "Upload a CV and get a structured review." },
  { to: "/app/interview", label: "Practice Interview", description: "Generate questions based on role and level." },
  { to: "/app/letter", label: "Write Letter", description: "Create or refine a motivation letter." },
  { to: "/app/practical", label: "Practical Exercise", description: "Generate a role-matched exercise." }
];

const DashboardPage = () => {
  const [cvHistory, setCvHistory] = useState([]);
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgradeError, setUpgradeError] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [cvRes, interviewRes] = await Promise.all([api.get("/cv/history"), api.get("/interviews/history")]);
        setCvHistory(cvRes.data);
        setInterviewHistory(interviewRes.data);
      } catch (err) {
        notify(err.response?.data?.message || "Could not load dashboard data", "error");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const latestInterview = useMemo(
    () => interviewHistory.find((item) => item.status === "in_progress") || interviewHistory[0] || null,
    [interviewHistory]
  );

  const latestCV = cvHistory[0] || null;
  const completedInterviews = interviewHistory.filter((item) => item.status === "completed");
  const completionRate = interviewHistory.length ? Math.round((completedInterviews.length / interviewHistory.length) * 100) : 0;
  const avgScore = completedInterviews.length
    ? Math.round(
        completedInterviews.reduce((sum, item) => sum + (item.finalReport?.overall || 0), 0) /
          completedInterviews.length
      )
    : 0;

  const upgradePlan = async () => {
    setUpgradeError("");
    try {
      const { data } = await api.post("/billing/checkout-session");
      window.location.href = data.checkoutUrl;
    } catch (error) {
      setUpgradeError(error.response?.data?.message || "Unable to start checkout");
    }
  };

  return (
    <div className="grid gap-lg">
      <section className="card dashboard-hero">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h1>{user?.name}</h1>
          <p className="section-copy">
            Prepare interviews faster with role-specific practice, clearer feedback, and a cleaner workflow.
          </p>
        </div>
        <div className="dashboard-hero-actions">
          <span className="pill primary-pill">{user?.plan?.toUpperCase()}</span>
          <span className="pill">{user?.role?.toUpperCase()}</span>
          <Link className="btn-secondary" to="/app/interview">
            Start interview
          </Link>
        </div>
      </section>

      <section className="stats-grid">
        <article className="card metric-card">
          <p className="muted">CV analyses</p>
          <h3>{user?.usage?.cvAnalyses ?? 0}</h3>
          <span className="muted">Analyses available in your account history</span>
        </article>
        <article className="card metric-card">
          <p className="muted">Interview simulations</p>
          <h3>{user?.usage?.simulations ?? 0}</h3>
          <span className="muted">Practice sessions created so far</span>
        </article>
        <article className="card metric-card">
          <p className="muted">Current plan</p>
          <h3>{user?.plan}</h3>
          {user?.plan === "free" ? (
            <>
              <button className="btn-primary" onClick={upgradePlan}>
                Upgrade to Premium
              </button>
              {upgradeError && <p className="error-text">{upgradeError}</p>}
            </>
          ) : (
            <span className="success-text">Premium access active</span>
          )}
        </article>
      </section>

      <section className="card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Analytics</p>
            <h3>Simple performance snapshot</h3>
          </div>
        </div>
        <div className="report-grid">
          <div className="card-inner">
            <p className="muted">Interview completion rate</p>
            <h3>{completionRate}%</h3>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${completionRate}%` }} />
            </div>
          </div>
          <div className="card-inner">
            <p className="muted">Average report score</p>
            <h3>{avgScore}/100</h3>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${avgScore}%` }} />
            </div>
          </div>
          <div className="card-inner">
            <p className="muted">Recent activity</p>
            <div className="chip-group">
              <span className="chip">{cvHistory.length} CVs</span>
              <span className="chip">{interviewHistory.length} sessions</span>
              <span className="chip">{completedInterviews.length} completed</span>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="section-head">
          <div>
            <p className="eyebrow">Quick actions</p>
            <h3>Keep momentum</h3>
          </div>
        </div>
        <div className="action-grid">
          {quickActions.map((item) => (
            <Link key={item.to} to={item.to} className="action-card">
              <strong>{item.label}</strong>
              <p className="muted">{item.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="dashboard-split">
        <section className="card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Next up</p>
              <h3>{latestInterview ? "Resume your last interview" : "No interview yet"}</h3>
            </div>
          </div>
          {latestInterview ? (
            <div className="item-row">
              <div className="answer-score-row">
                <strong>{latestInterview.jobTitle}</strong>
                {latestInterview.finalReport?.overall != null && (
                  <span className="pill">{latestInterview.finalReport.overall}/100</span>
                )}
              </div>
              <p className="muted">
                {latestInterview.field} | {latestInterview.level} | {latestInterview.status}
              </p>
              <div className="row-actions">
                <button
                  className="btn-primary"
                  onClick={() => navigate("/app/interview", { state: { resumeSessionId: latestInterview._id } })}
                >
                  Open session
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>No interview simulation has been created yet.</p>
              <Link className="btn-primary" to="/app/interview">
                Create one
              </Link>
            </div>
          )}
        </section>

        <section className="card">
          <div className="section-head">
            <div>
              <p className="eyebrow">Latest CV</p>
              <h3>Recent feedback</h3>
            </div>
          </div>
          {latestCV ? (
            <div className="item-row">
              <strong>{latestCV.fileName}</strong>
              <p>{latestCV.summary}</p>
              <div className="chip-group">
                {(latestCV.extractedSkills || []).slice(0, 5).map((skill) => (
                  <span key={skill} className="chip">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>No CV analysis yet.</p>
              <Link className="btn-primary" to="/app/cv">
                Upload CV
              </Link>
            </div>
          )}
        </section>
      </section>
    </div>
  );
};

export default DashboardPage;
