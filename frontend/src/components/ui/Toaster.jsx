import { useEffect, useState } from "react";

const typeLabels = {
  info: "Info",
  success: "Success",
  error: "Error"
};

const Toaster = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (event) => {
      const toast = event.detail;
      setToasts((current) => [...current, toast]);

      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id));
      }, 3200);
    };

    window.addEventListener("app:toast", handleToast);
    return () => window.removeEventListener("app:toast", handleToast);
  }, []);

  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type || "info"}`}>
          <strong>{typeLabels[toast.type] || "Info"}</strong>
          <p>{toast.message}</p>
        </div>
      ))}
    </div>
  );
};

export default Toaster;
