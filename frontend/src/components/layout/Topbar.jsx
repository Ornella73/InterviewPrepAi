import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Topbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="topbar">
      <div>
        <p className="muted">Welcome back</p>
        <h2>{user?.name}</h2>
      </div>
      <div className="topbar-actions">
        <span className="plan-tag role">{user?.role?.toUpperCase()}</span>
        <span className={`plan-tag ${user?.plan === "premium" ? "premium" : "free"}`}>
          {user?.plan?.toUpperCase()}
        </span>
        <button className="btn-secondary" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Topbar;
