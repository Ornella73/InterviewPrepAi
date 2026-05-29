import { Link } from "react-router-dom";

const highlights = [
  "Role-specific interview practice",
  "More professional motivation letters",
  "CV insights and rewrite suggestions",
  "Structured final reports and history"
];

const OnboardingPage = () => {
  return (
    <div className="onboarding">
      <div className="hero-card onboarding-grid">
        <div>
          <img src="/InterviewLogo.png" alt="InterviewPrep AI logo" className="hero-logo" />
          <p className="eyebrow">Interview prep platform</p>
          <h1>Prepare smarter interviews with a cleaner workflow</h1>
          <p className="section-copy">
            Upload a CV, generate tailored questions, practice with real structure, and produce application materials that feel more professional.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="btn-primary">
              Start free
            </Link>
            <Link to="/login" className="btn-secondary">
              Login
            </Link>
          </div>
        </div>

        <div className="feature-panel">
          <p className="eyebrow">What you get</p>
          {highlights.map((item) => (
            <div key={item} className="item-row">
              <strong>{item}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
