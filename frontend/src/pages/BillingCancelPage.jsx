import { Link } from "react-router-dom";

const BillingCancelPage = () => {
  return (
    <section className="card hero-strip">
      <div>
        <p className="eyebrow">Payment</p>
        <h3>Checkout cancelled</h3>
        <p>Your plan has not changed. You can retry checkout whenever you are ready.</p>
      </div>
      <Link to="/app" className="btn-primary">
        Back to Dashboard
      </Link>
    </section>
  );
};

export default BillingCancelPage;
