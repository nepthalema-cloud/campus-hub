import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

function Connections() {
  const navigate = useNavigate();
  const [incoming, setIncoming] = useState([]);
  const [sent, setSent] = useState([]);
  const [connections, setConnections] = useState([]);
  const [activeTab, setActiveTab] = useState("incoming");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const isInitialLoadRef = useRef(true);
  const incomingRef = useRef([]);
  const sentRef = useRef([]);
  const connectionsRef = useRef([]);

  const connectionsEqual = (oldArr, newArr) => {
    if (oldArr.length !== newArr.length) return false;
    return oldArr.every((item, index) => {
      const newItem = newArr[index];
      return (
        item.id === newItem.id &&
        item.status === newItem.status &&
        item.first_name === newItem.first_name &&
        item.last_name === newItem.last_name &&
        item.department === newItem.department &&
        item.year === newItem.year &&
        item.profile_image === newItem.profile_image
      );
    });
  };

  const loadConnections = async () => {
    try {
      const response = await axios.get("/api/connections/", {
        withCredentials: true,
      });
      const newIncoming = response.data.incoming_requests || [];
      const newSent = response.data.sent_requests || [];
      const newConnections = response.data.connections || [];

      if (!connectionsEqual(incomingRef.current, newIncoming)) {
        setIncoming(newIncoming);
        incomingRef.current = newIncoming;
      }
      if (!connectionsEqual(sentRef.current, newSent)) {
        setSent(newSent);
        sentRef.current = newSent;
      }
      if (!connectionsEqual(connectionsRef.current, newConnections)) {
        setConnections(newConnections);
        connectionsRef.current = newConnections;
      }
    } catch (error) {
      setMessage("Unable to load connection data.");
    } finally {
      if (isInitialLoadRef.current) {
        setLoading(false);
        isInitialLoadRef.current = false;
      }
    }
  };

  useEffect(() => {
    loadConnections();
    const interval = setInterval(loadConnections, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleAction = async (url, method, data = {}) => {
    setMessage("");

    try {
      const csrfResponse = await axios.get("/api/csrf/", { withCredentials: true });
      const csrfToken = csrfResponse.data.csrfToken;

      if (method === "post") {
        await axios.post(url, data, {
          withCredentials: true,
          headers: { "X-CSRFToken": csrfToken },
        });
      } else if (method === "delete") {
        await axios.delete(url, {
          params: data,
          withCredentials: true,
          headers: { "X-CSRFToken": csrfToken },
        });
      }

      await loadConnections();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to complete action.");
    }
  };

  const renderConnectionCard = (connection) => {
    const imageUrl = connection.profile_image
      ? connection.profile_image.startsWith("http")
        ? connection.profile_image
        : connection.profile_image.startsWith("/media/")
        ? `${window.API_BASE_URL}${connection.profile_image}`
        : connection.profile_image
      : null;

    const displayName = `${connection.first_name || ""} ${connection.last_name || ""}`
      .trim() || connection.other_username;

    return (
      <div key={connection.id} className="profile-card">
        {imageUrl ? (
          <div className="avatar avatar-small">
            <img src={imageUrl} alt={displayName} />
          </div>
        ) : (
          <div className="avatar avatar-small placeholder-avatar">
            {displayName.charAt(0).toUpperCase() || "?"}
          </div>
        )}
        <h3 className="profile-card-title">{displayName}</h3>
        <div className="profile-meta">
          {activeTab !== "sent" && (
            <div className="profile-meta-item">
              <strong>Username</strong>
              <span>{connection.other_username}</span>
            </div>
          )}
          <div className="profile-meta-item">
            <strong>Department</strong>
            <span>{connection.department}</span>
          </div>
          <div className="profile-meta-item">
            <strong>Year</strong>
            <span>{connection.year}</span>
          </div>
        </div>
        <div className="actions">
          {activeTab === "incoming" && (
            <>
              <button
                className="button button-primary"
                type="button"
                onClick={() => {
                  if (!connection.id) {
                    setMessage("Unable to accept request: missing connection id.");
                    return;
                  }

                  handleAction(`/api/connections/accept/${connection.id}/`, "post");
                }}
              >
                Accept
              </button>
              <button
                className="button button-danger"
                type="button"
                onClick={() => {
                  if (!connection.id) {
                    setMessage("Unable to reject request: missing connection id.");
                    return;
                  }

                  handleAction(`/api/connections/reject/${connection.id}/`, "post");
                }}
              >
                Decline
              </button>
            </>
          )}
          {activeTab === "sent" && (
            <button
              className="button button-secondary"
              type="button"
              onClick={() => {
                if (!connection.id) {
                  setMessage("Unable to cancel request: missing connection id.");
                  return;
                }

                handleAction(`/api/connections/remove/${connection.id}/`, "delete");
              }}
            >
              Cancel Request
            </button>
          )}
          {activeTab === "connected" && (
            <>
              <button
                className="button button-primary"
                type="button"
                onClick={() => {
                  if (!connection.other_user_id) {
                    setMessage("Unable to open chat: missing user id.");
                    return;
                  }

                  navigate(`/messages/${connection.other_user_id}`);
                }}
              >
                Message
              </button>
              <button
                className="button button-danger"
                type="button"
                onClick={() => {
                  if (!connection.id) {
                    setMessage("Unable to remove connection: missing connection id.");
                    return;
                  }

                  handleAction(`/api/connections/remove/${connection.id}/`, "delete");
                }}
              >
                Remove
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderCurrentSection = () => {
    const sectionData =
      activeTab === "incoming"
        ? incoming
        : activeTab === "sent"
        ? sent
        : connections;

    const emptyMessages = {
      incoming: "No incoming connection requests.",
      sent: "No connection requests sent yet.",
      connected: "You have no accepted connections yet.",
    };

    return sectionData.length === 0 ? (
      <p>{emptyMessages[activeTab]}</p>
    ) : (
      <div className="card-grid">
        {sectionData.map((connection) => renderConnectionCard(connection))}
      </div>
    );
  };

  return (
    <div className="page-card">
      <div className="page-card-header">
        <h1 className="page-heading">Connections</h1>
        <p className="page-subtitle">
          Manage your pending requests, sent invitations, and accepted connections.
        </p>
      </div>

      {message && <div className="alert alert-info">{message}</div>}

      {loading ? (
        <div className="page-card">
          <h2>Loading connection data...</h2>
        </div>
      ) : (
        <>
          <div className="tabs">
            <button
              className={`tab-button ${activeTab === "incoming" ? "active" : ""}`}
              onClick={() => setActiveTab("incoming")}
            >
              Incoming ({incoming.length})
            </button>
            <button
              className={`tab-button ${activeTab === "sent" ? "active" : ""}`}
              onClick={() => setActiveTab("sent")}
            >
              Sent ({sent.length})
            </button>
            <button
              className={`tab-button ${activeTab === "connected" ? "active" : ""}`}
              onClick={() => setActiveTab("connected")}
            >
              Connected ({connections.length})
            </button>
          </div>

          <section className="section-block">
            <div className="section-header">
              <div>
                <h2>
                  {activeTab === "incoming" && "Incoming Requests"}
                  {activeTab === "sent" && "Sent Requests"}
                  {activeTab === "connected" && "Accepted Connections"}
                </h2>
                <p className="section-description">
                  {activeTab === "incoming" && "Review and respond to connection requests from other students."}
                  {activeTab === "sent" && "Track your outgoing requests and cancel any pending invitations."}
                  {activeTab === "connected" && "Chat with your current connections or remove connections you no longer need."}
                </p>
              </div>
            </div>
            {renderCurrentSection()}
          </section>
        </>
      )}

      <div className="profile-actions">
        <Link className="button button-secondary" to="/dashboard">
          Back to Dashboard
        </Link>
        <Link className="button button-secondary" to="/directory">
          Browse Directory
        </Link>
      </div>
    </div>
  );
}

export default Connections;
