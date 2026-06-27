import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

function MessagesHome() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isInitialLoadRef = useRef(true);

  const loadConnections = async () => {
    if (isInitialLoadRef.current) {
      setLoading(true);
    }
    setError("");

    try {
      const response = await axios.get("/api/connections/", {
        withCredentials: true,
      });
      setConnections(response.data.connections || []);
    } catch (err) {
      setError("Unable to load conversations.");
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

    const handleUnreadUpdate = () => {
      loadConnections();
    };
    window.addEventListener('unreadCountUpdated', handleUnreadUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('unreadCountUpdated', handleUnreadUpdate);
    };
  }, []);

  return (
    <div className="page-card messages-home-card">
      <div className="page-card-header">
        <h1 className="page-heading">Messages</h1>
        <p className="page-subtitle">
          Recent chats and connected users. Click a contact to open the conversation.
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="page-card">
          <h2>Loading conversations...</h2>
        </div>
      ) : (
        <div className="section-block">
          {connections.length === 0 ? (
            <>
              <p>You have no connected users yet. Open a chat from your connections.</p>
              <Link className="button button-primary" to="/connections">
                View Connections
              </Link>
            </>
          ) : (
            <div className="conversation-sidebar">
              {connections.map((connection) => {
                const imageUrl = connection.profile_image
                  ? connection.profile_image.startsWith("http")
                    ? connection.profile_image
                    : connection.profile_image.startsWith("/media/")
                    ? `${window.API_BASE_URL}${connection.profile_image}`
                    : connection.profile_image
                  : null;
                const displayName = (connection.first_name || connection.last_name)
                  ? `${connection.first_name} ${connection.last_name}`.trim()
                  : connection.other_username;
                return (
                  <Link
                    key={connection.other_user_id}
                    className="conversation-card"
                    to={`/messages/${connection.other_user_id}`}
                  >
                    <div className="conversation-avatar">
                      {imageUrl ? (
                        <img src={imageUrl} alt={displayName} />
                      ) : (
                        <span>
                          {connection.first_name?.charAt(0).toUpperCase() || connection.last_name?.charAt(0).toUpperCase() || connection.other_username?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="conversation-info">
                      <h3>{displayName}</h3>
                      <p>{connection.department || "Connected user"}</p>
                    </div>
                    {connection.unread_count > 0 && (
                      <span className="conversation-badge">{connection.unread_count > 99 ? '99+' : connection.unread_count}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MessagesHome;
