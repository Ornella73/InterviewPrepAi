import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { notify } from "../utils/notify";

const AdminPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/users");
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users");
      notify(err.response?.data?.message || "Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      loadUsers();
    }
  }, [user]);

  const updateAccess = async (targetUser, payload) => {
    try {
      await api.patch(`/admin/users/${targetUser._id}/access`, payload);
      await loadUsers();
      notify("User access updated", "success");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user access");
      notify(err.response?.data?.message || "Failed to update user access", "error");
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((item) =>
      `${item.name} ${item.email} ${item.role} ${item.plan}`.toLowerCase().includes(query.toLowerCase())
    );
  }, [users, query]);

  const stats = useMemo(
    () => ({
      total: users.length,
      premium: users.filter((item) => item.plan === "premium").length,
      active: users.filter((item) => item.isActive).length,
      admins: users.filter((item) => item.role === "admin").length
    }),
    [users]
  );

  if (user?.role !== "admin") {
    return (
      <section className="card">
        <p className="eyebrow">Admin</p>
        <h3>Admin Dashboard</h3>
        <p className="error-text">Admin access required.</p>
      </section>
    );
  }

  return (
    <div className="grid gap-lg">
      <section className="card hero-strip">
        <div>
          <p className="eyebrow">Admin dashboard</p>
          <h3>Manage access and premium status</h3>
          <p className="section-copy">Use this panel to activate accounts, review premium access, and keep the platform clean.</p>
        </div>
        <button className="btn-secondary" onClick={loadUsers}>
          Refresh
        </button>
      </section>

      <section className="stats-grid">
        <article className="card metric-card"><p className="muted">Total users</p><h3>{stats.total}</h3></article>
        <article className="card metric-card"><p className="muted">Active</p><h3>{stats.active}</h3></article>
        <article className="card metric-card"><p className="muted">Premium</p><h3>{stats.premium}</h3></article>
        <article className="card metric-card"><p className="muted">Admins</p><h3>{stats.admins}</h3></article>
      </section>

      <section className="card">
        <div className="inline-form">
          <input placeholder="Search name, email, role, plan" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        {error && <p className="error-text">{error}</p>}
        {loading && <p className="muted">Loading users...</p>}

        {!loading && filteredUsers.length === 0 && <div className="empty-state">No user matches your search.</div>}

        {!loading && filteredUsers.length > 0 && (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Account</th>
                  <th>Plan</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((item) => (
                  <tr key={item._id}>
                    <td>{item.name}</td>
                    <td>{item.email}</td>
                    <td>{item.role}</td>
                    <td>{item.isActive ? "Active" : "Deactivated"}</td>
                    <td>{item.plan}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="btn-secondary"
                          onClick={() => updateAccess(item, { isActive: !item.isActive })}
                          disabled={item.role === "admin"}
                        >
                          {item.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          className="btn-primary"
                          onClick={() => updateAccess(item, { plan: item.plan === "premium" ? "free" : "premium" })}
                        >
                          {item.plan === "premium" ? "Revoke" : "Grant"} Premium
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminPage;
