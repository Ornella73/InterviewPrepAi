import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const BillingSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("Verifying payment...");
  const { refreshMe } = useAuth();

  useEffect(() => {
    const verify = async () => {
      const sessionId = searchParams.get("session_id");
      if (!sessionId) {
        setStatus("Missing session ID. Contact support if payment was completed.");
        return;
      }

      try {
        await api.get(`/billing/verify-session?session_id=${encodeURIComponent(sessionId)}`);
        await refreshMe();
        setStatus("Payment received. Premium access is active.");
      } catch (_error) {
        setStatus("Payment verification failed. If you paid successfully, refresh in a few seconds.");
      }
    };

    verify();
  }, [refreshMe, searchParams]);

  return (
    <section className="card hero-strip">
      <div>
        <p className="eyebrow">Payment</p>
        <h3>Premium upgrade</h3>
        <p>{status}</p>
      </div>
      <Link to="/app" className="btn-primary">
        Return to Dashboard
      </Link>
    </section>
  );
};

export default BillingSuccessPage;
