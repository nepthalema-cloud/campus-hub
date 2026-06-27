import { useEffect, useState } from "react";

function Notification({ message, type = "info", duration = 4000 }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    setVisible(true);

    const exitTimer = setTimeout(() => {
      setExiting(true);
    }, duration - 500);

    const removeTimer = setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [duration]);

  const typeStyles = {
    success: "notification-success",
    info: "notification-info",
    warning: "notification-warning",
    error: "notification-error",
  };

  if (!visible) return null;

  return (
    <div
      className={`notification ${typeStyles[type] || typeStyles.info} ${exiting ? "notification-exiting" : ""}`}
    >
      <span className="notification-icon">
        {type === "success" && "✓"}
        {type === "info" && "🔔"}
        {type === "warning" && "⚠"}
        {type === "error" && "✕"}
      </span>
      <span className="notification-message">{message}</span>
    </div>
  );
}

export default Notification;
