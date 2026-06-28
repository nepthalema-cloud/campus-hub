import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    try {
      const csrfResponse = await axios.get("/api/csrf/", {
        withCredentials: true,
      });

      await axios.post(
        "/api/password/change/",
        {
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        },
        {
          withCredentials: true,
          headers: {
            "X-CSRFToken": csrfResponse.data.csrfToken,
          },
        }
      );

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/profile");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password.");
    }
  };

  return (
    <div className="page-card">
      <div className="page-card-header">
        <h1 className="page-heading">Change Password</h1>
        <p className="page-subtitle">
          Update your password to keep your account secure.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label className="label" htmlFor="current-password">Current Password</label>
            <input
              className="input"
              id="current-password"
              type="password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="new-password">New Password</label>
            <input
              className="input"
              id="new-password"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="confirm-password">Confirm New Password</label>
            <input
              className="input"
              id="confirm-password"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {success && (
          <div className="alert">
            Password changed successfully! Redirecting to profile...
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        <div className="actions">
          <button type="submit" className="button button-primary">
            Change Password
          </button>
          <Link className="button button-secondary" to="/profile">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

export default ChangePassword;
