export const notify = (message, type = "info") => {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("app:toast", {
      detail: {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        message,
        type
      }
    })
  );
};
