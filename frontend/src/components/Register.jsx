import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  async function register() {
    setMessage("");
    setFieldErrors({});
    setLoading(true);

    try {
      const response = await axios.post(
        "/api/register/",
        {
          username,
          password,
        },
        {
          withCredentials: true,
        }
      );
      setMessage(response.data.message || "Registration completed successfully.");
      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      const backendError = error.response?.data;
      const newFieldErrors = {};
      let errorMessage = "Registration failed. Please try again.";

      if (backendError && typeof backendError === "object" && !Array.isArray(backendError)) {
        ["username", "password", "email"].forEach((field) => {
          if (backendError[field]) {
            newFieldErrors[field] = Array.isArray(backendError[field])
              ? backendError[field].join(" ")
              : String(backendError[field]);
          }
        });

        if (backendError.non_field_errors) {
          errorMessage = Array.isArray(backendError.non_field_errors)
            ? backendError.non_field_errors.join(" ")
            : String(backendError.non_field_errors);
        } else if (backendError.detail) {
          errorMessage = String(backendError.detail);
        } else if (backendError.message) {
          errorMessage = String(backendError.message);
        } else if (Object.keys(newFieldErrors).length > 0) {
          errorMessage = "Please fix the highlighted fields.";
        }
      } else if (typeof backendError === "string") {
        errorMessage = backendError;
      }

      setFieldErrors(newFieldErrors);
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-card">
      <div className="page-card-header">
        <h1 className="page-heading">Create a Campus Hub account</h1>
        <p className="page-subtitle">
          Join the portal to manage your student profile and access campus services.
        </p>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label className="label">Username</label>
          <input
            className="input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a username"
          />
          {fieldErrors.username && (
            <div className="input-error">{fieldErrors.username}</div>
          )}
        </div>
        <div className="form-group">
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a secure password"
          />
          {fieldErrors.password && (
            <div className="input-error">{fieldErrors.password}</div>
          )}
        </div>
      </div>

      {message && <div className="alert">{message}</div>}

      <div className="actions">
        <button className="button button-primary" type="button" onClick={register} disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </button>
        <Link className="button button-secondary" to="/login">
          Back to login
        </Link>
      </div>
    </div>
  );
}

export default Register;
