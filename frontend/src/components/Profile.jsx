import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleDelete = async () => {
    const confirmed = window.confirm("Are you sure you want to delete your account?");
    if (!confirmed) return;

    try {
      const csrfResponse = await axios.get("/api/csrf/", {
        withCredentials: true,
      });

      await axios.delete("/api/account/delete/", {
        withCredentials: true,
        headers: {
          "X-CSRFToken": csrfResponse.data.csrfToken,
        },
      });

      alert("Account deleted successfully!");
      navigate("/login");
    } catch (error) {
      alert("Failed to delete account.");
    }
  };

  useEffect(() => {
    axios
      .get("/api/profile/", {
        withCredentials: true,
      })
      .then((response) => {
        setProfile(response.data);
      })
      .catch((error) => {
        if (error.response?.status === 404) {
          navigate("/create-profile");
          return;
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return (
      <div className="page-card">
        <h2>Loading profile...</h2>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page-card">
        <h2>Profile not found.</h2>
      </div>
    );
  }

  const profileImageUrl = profile?.profile_image
    ? profile.profile_image.startsWith("http")
      ? profile.profile_image
      : profile.profile_image.startsWith("/media/")
      ? `${window.API_BASE_URL}${profile.profile_image}`
      : profile.profile_image
    : null;

  const displayName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || profile.username || "User";

  return (
    <div className="page-card">
      <div className="page-card-header">
        <h1 className="page-heading">Student Profile</h1>
        <p className="page-subtitle">
          Review your student details and keep your information up to date.
        </p>
      </div>

      <div className="profile-avatar-wrap">
        {profileImageUrl ? (
          <div className="avatar avatar-large">
            <img src={profileImageUrl} alt={displayName} />
          </div>
        ) : (
          <div className="avatar avatar-large placeholder-avatar">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="profile-grid">
        <div className="profile-field">
          <strong>First Name</strong>
          <span>{profile.first_name}</span>
        </div>
        <div className="profile-field">
          <strong>Last Name</strong>
          <span>{profile.last_name}</span>
        </div>
        <div className="profile-field">
          <strong>Email</strong>
          <span>{profile.email}</span>
        </div>
        <div className="profile-field">
          <strong>Department</strong>
          <span>{profile.department}</span>
        </div>
        <div className="profile-field">
          <strong>Year</strong>
          <span>{profile.year}</span>
        </div>
      </div>

      <div className="profile-actions">
        <Link className="button button-secondary" to="/profile/edit">
          Edit Profile
        </Link>
        <Link className="button button-secondary" to="/change-password">
          Change Password
        </Link>
        <button className="button button-danger" type="button" onClick={handleDelete}>
          Delete Account
        </button>
      </div>
    </div>
  );
}

export default Profile;
