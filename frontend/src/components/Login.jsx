import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login() {
    setError("");
    setLoading(true);

    try {
      await axios.post(
        "/api/login/",
        { username, password },
        { withCredentials: true }
      );

      try {
        await axios.get("/api/profile/", {
          withCredentials: true,
        });
        navigate("/dashboard");
      } catch (profileError) {
        if (profileError.response?.status === 404) {
          navigate("/create-profile");
          return;
        }
        throw profileError;
      }
    } catch (error) {
      setError(error.response?.data?.message || "Unable to login. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-card">
      <div className="page-card-header">
        <h1 className="page-heading">Sign in to Campus Hub</h1>
        <p className="page-subtitle">
          Use your student username to access your profile and dashboard.
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
            placeholder="Enter username"
          />
        </div>
        <div className="form-group">
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="actions">
        <button className="button button-primary" type="button" onClick={login} disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
        <Link className="button button-secondary" to="/register">
          Create account
        </Link>
      </div>
    </div>
  );
}

export default Login;
