import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import Login from "./components/Login";
import Register from "./components/Register";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./components/Profile";
import EditProfile from "./components/EditProfile";
import CreateProfile from "./components/CreateProfile";
import ChangePassword from "./components/ChangePassword";
import StudentDirectory from "./components/StudentDirectory";
import Connections from "./components/Connections";
import Messages from "./components/Messages";
import MessagesHome from "./components/MessagesHome";
import Navbar from "./components/Navbar";
import Notification from "./components/Notification";

function App() {
  const location = useLocation();
  const isLandingPage = location.pathname === "/";
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const handleNewMessage = (event) => {
      setNotification(event.detail.message);
    };

    window.addEventListener('newMessageNotification', handleNewMessage);

    return () => {
      window.removeEventListener('newMessageNotification', handleNewMessage);
    };
  }, []);

  return (
    <div className="app-shell">
      {!isLandingPage && !["/login", "/register"].includes(location.pathname) && <Navbar />}
      {notification && (
        <Notification
          message={notification}
          type="info"
          duration={4000}
        />
      )}

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-profile"
          element={
            <ProtectedRoute>
              <CreateProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/directory"
          element={
            <ProtectedRoute>
              <StudentDirectory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/connections"
          element={
            <ProtectedRoute>
              <Connections />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <MessagesHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages/:userId"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
