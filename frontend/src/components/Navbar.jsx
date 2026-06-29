import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import axios from "axios";

function Navbar() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const unreadCountRef = useRef(0);
  const pendingCountRef = useRef(0);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await axios.get("/api/me/", {
          withCredentials: true,
        });

        setUser(response.data.user);
      } catch {
        setUser(null);
      }
    };

    const loadUnreadCount = async () => {
      try {
        const response = await axios.get("/api/messages/unread-count/", {
          withCredentials: true,
        });
        const newUnreadCount = response.data.total_unread || 0;
        const previousCount = unreadCountRef.current;
        if (newUnreadCount !== previousCount) {
          setUnreadCount(newUnreadCount);
          unreadCountRef.current = newUnreadCount;

          // Dispatch notification if unread count increased and we're not on messages page
          if (newUnreadCount > previousCount && !window.location.pathname.startsWith('/messages')) {
            const bySender = response.data.by_sender || [];
            const latestSender = bySender.length > 0 ? bySender[0] : null;
            const message = latestSender
              ? `🔔 New message from ${latestSender.sender_username}`
              : `🔔 You have ${newUnreadCount} new message${newUnreadCount > 1 ? 's' : ''}`;
            window.dispatchEvent(new CustomEvent('newMessageNotification', {
              detail: { message }
            }));
          }
        }
      } catch {
        setUnreadCount(0);
      }
    };

    const loadPendingCount = async () => {
      try {
        const response = await axios.get("/api/connections/", {
          withCredentials: true,
        });
        const newPendingCount = response.data.incoming_requests?.length || 0;
        if (newPendingCount !== pendingCountRef.current) {
          setPendingCount(newPendingCount);
          pendingCountRef.current = newPendingCount;
        }
      } catch {
        setPendingCount(0);
      }
    };

    if (!["/login", "/register"].includes(location.pathname)) {
      loadUser();
      loadUnreadCount();
      loadPendingCount();
      const unreadInterval = setInterval(loadUnreadCount, 5000);
      const pendingInterval = setInterval(loadPendingCount, 5000);

      const handleUnreadUpdate = () => {
        loadUnreadCount();
      };

      window.addEventListener('unreadCountUpdated', handleUnreadUpdate);

      return () => {
        clearInterval(unreadInterval);
        clearInterval(pendingInterval);
        window.removeEventListener('unreadCountUpdated', handleUnreadUpdate);
      };
    }

    setMenuOpen(false);
  }, [location.pathname]);

  const profileImageUrl = user?.profile_image
    ? user.profile_image.startsWith("http")
      ? user.profile_image
      : user.profile_image.startsWith("/media/")
      ? `${window.API_BASE_URL}${user.profile_image}`
      : user.profile_image
    : null;

  const displayName = user?.first_name || user?.username || "Student";


  return (
    <nav className="navbar">
      <div className="nav-brand">
        <span className="nav-logo">Campus Hub</span>
      </div>

      <button
        className="nav-toggle"
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label="Toggle navigation"
      >
        ☰
      </button>

      <div className={`nav-links ${menuOpen ? "open" : ""}`}>
        <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} end to="/dashboard">
          Dashboard
        </NavLink>
        <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} end to="/directory">
          Directory
        </NavLink>
        <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} end to="/connections">
          Connections{pendingCount > 0 && <span className="nav-badge">{pendingCount > 99 ? '99+' : pendingCount}</span>}
        </NavLink>
        <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/messages">
          Messages{unreadCount > 0 && <span className="nav-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
        </NavLink>
        <NavLink className={({ isActive }) => `nav-link${isActive ? " active" : ""}`} to="/profile">
          Profile
        </NavLink>
      </div>

      <div className="nav-right">
        <span className="nav-username">{displayName}</span>
        <div className="navbar-avatar">
          {profileImageUrl ? (
            <img src={profileImageUrl} alt={displayName} />
          ) : (
            <div className="avatar avatar-small placeholder-avatar">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
