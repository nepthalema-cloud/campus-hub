function LoadingSkeleton({ type = "card" }) {
  if (type === "card") {
    return (
      <div className="skeleton-card">
        <div className="skeleton-avatar"></div>
        <div className="skeleton-content">
          <div className="skeleton-line skeleton-line-long"></div>
          <div className="skeleton-line skeleton-line-medium"></div>
          <div className="skeleton-line skeleton-line-short"></div>
        </div>
      </div>
    );
  }

  if (type === "text") {
    return (
      <div className="skeleton-text">
        <div className="skeleton-line skeleton-line-long"></div>
        <div className="skeleton-line skeleton-line-medium"></div>
      </div>
    );
  }

  if (type === "avatar") {
    return <div className="skeleton-avatar"></div>;
  }

  return <div className="skeleton-card"></div>;
}

export default LoadingSkeleton;
