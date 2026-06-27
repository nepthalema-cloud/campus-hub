import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaUsers, FaComments, FaUserFriends, FaSignOutAlt } from "react-icons/fa";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [connectionCount, setConnectionCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const isInitialLoadRef = useRef(true);
  const pendingCountRef = useRef(0);
  const connectionCountRef = useRef(0);
  const unreadCountRef = useRef(0);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [userResponse, connectionsResponse, unreadResponse] = await Promise.all([
          axios.get("/api/me/", {
            withCredentials: true,
          }),
          axios.get("/api/connections/", {
            withCredentials: true,
          }),
          axios.get("/api/messages/unread-count/", {
            withCredentials: true,
          }),
        ]);

        const newPendingCount = connectionsResponse.data.incoming_requests?.length || 0;
        const newConnectionCount = connectionsResponse.data.connections?.length || 0;
        const newUnreadCount = unreadResponse.data.total_unread || 0;

        setUser(userResponse.data.user);

        if (newPendingCount !== pendingCountRef.current) {
          setPendingCount(newPendingCount);
          pendingCountRef.current = newPendingCount;
        }
        if (newConnectionCount !== connectionCountRef.current) {
          setConnectionCount(newConnectionCount);
          connectionCountRef.current = newConnectionCount;
        }
        if (newUnreadCount !== unreadCountRef.current) {
          setUnreadCount(newUnreadCount);
          unreadCountRef.current = newUnreadCount;
        }
      } catch {
        navigate("/login");
      } finally {
        if (isInitialLoadRef.current) {
          setLoading(false);
          isInitialLoadRef.current = false;
        }
      }
    };

    loadDashboard();
    const interval = setInterval(loadDashboard, 10000);

    return () => clearInterval(interval);
  }, [navigate]);

  async function logout() {
    await axios.get("/api/logout/", {
      withCredentials: true,
    });
    navigate("/login");
  }

  const profileImageUrl = user?.profile_image
    ? user.profile_image.startsWith("http")
      ? user.profile_image
      : user.profile_image.startsWith("/media/")
      ? `${window.API_BASE_URL}${user.profile_image}`
      : user.profile_image
    : null;

  const displayName = user?.first_name || user?.username || "Student";

  const quickActions = [
    {
      icon: <FaUser />,
      title: "Profile",
      description: "Manage your information",
      to: "/profile",
    },
    {
      icon: <FaUsers />,
      title: "Directory",
      description: "Find students",
      to: "/directory",
    },
    {
      icon: <FaUserFriends />,
      title: "Connections",
      description: "Manage requests",
      to: "/connections",
    },
    {
      icon: <FaComments />,
      title: "Messages",
      description: "Open conversations",
      to: "/messages",
    },
  ];

  const stats = [
    {
      label: "Connections",
      value: loading ? "--" : connectionCount,
      icon: <FaUserFriends />,
    },
    {
      label: "Pending Requests",
      value: loading ? "--" : pendingCount,
      icon: <FaUserFriends />,
    },
    {
      label: "Unread Messages",
      value: loading ? "--" : unreadCount,
      icon: <FaComments />,
    },
  ];

  const activityItems = [
    {
      title: "New connection request",
      description: "You received a connection request from a classmate.",
      time: "2 hours ago",
    },
    {
      title: "New message",
      description: "You have a fresh message waiting in your inbox.",
      time: "5 hours ago",
    },
    {
      title: "Profile updated",
      description: "Your student profile information was refreshed successfully.",
      time: "1 day ago",
    },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-avatar">
          {profileImageUrl ? (
            <img src={profileImageUrl} alt={displayName} />
          ) : (
            <div className="avatar-placeholder">{displayName.charAt(0).toUpperCase()}</div>
          )}
        </div>
        <div className="dashboard-welcome">
          <h1 className="dashboard-title">Welcome back, {displayName} 👋</h1>
          <p className="dashboard-subtitle">Good to see you again.</p>
        </div>
        <button className="logout-button" type="button" onClick={logout}>
          <FaSignOutAlt />
          <span>Log out</span>
        </button>
      </div>

      <div className="dashboard-content">
        <section className="dashboard-section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="quick-actions-grid">
            {quickActions.map((action) => (
              <Link key={action.title} to={action.to} className="quick-action-card">
                <div className="quick-action-icon">{action.icon}</div>
                <h3 className="quick-action-title">{action.title}</h3>
                <p className="quick-action-description">{action.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="dashboard-section">
          <h2 className="section-title">Statistics</h2>
          <div className="stats-grid">
            {stats.map((stat) => (
              <div key={stat.label} className="stat-card">
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-content">
                  <span className="stat-value">{stat.value}</span>
                  <span className="stat-label">{stat.label}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-section">
          <h2 className="section-title">Recent Activity</h2>
          <div className="activity-list">
            {activityItems.length > 0 ? (
              activityItems.map((item) => (
                <div key={item.title} className="activity-item">
                  <div className="activity-dot"></div>
                  <div className="activity-content">
                    <strong className="activity-title">{item.title}</strong>
                    <p className="activity-description">{item.description}</p>
                    <span className="activity-time">{item.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-activity">No recent activity.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
