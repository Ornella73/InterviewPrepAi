import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Sidebar = () => {
  const { user } = useAuth();
  const links = [
    { to: "/app", label: "Dashboard" },
    { to: "/app/cv", label: "CV Analysis" },
    { to: "/app/letter", label: "Motivation Letter" },
    { to: "/app/interview", label: "Interview" },
    { to: "/app/practical", label: "Practical" },
    { to: "/app/history", label: "History" },
    ...(user?.role === "admin" ? [{ to: "/app/admin", label: "Admin" }] : [])
  ];

  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark">
          <img src="/InterviewLogo.png" alt="InterviewPrep AI logo" className="brand-logo" />
          <div>
            <p className="brand-kicker">SaaS Platform</p>
            <h1 className="brand-title">InterviewPrep AI</h1>
          </div>
        </div>
        <div className="item-row">
          <p className="muted">Signed in as</p>
          <strong>{user?.name}</strong>
          <p className="muted">{user?.email}</p>
          <div className="chip-group">
            <span className="chip">{user?.role?.toUpperCase()}</span>
            <span className="chip">{user?.plan?.toUpperCase()}</span>
          </div>
        </div>
      </div>
      <nav>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/app"}
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            {link.label}
          </NavLink>
        ))}
        <NavLink to="/app/interview" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
          Resume practice
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
