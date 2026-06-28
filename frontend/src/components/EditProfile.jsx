import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function EditProfile() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get("/api/profile/", {
        withCredentials: true,
      })
      .then((response) => {
        setFirstName(response.data.first_name);
        setLastName(response.data.last_name);
        setEmail(response.data.email);
        setDepartment(response.data.department);
        setYear(response.data.year);
        setProfileImageUrl(response.data.profile_image || "");
      })
      .catch(() => {
        setError("Unable to load profile data.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile() {
    setError("");

    try {
      const csrfResponse = await axios.get("/api/csrf/", {
        withCredentials: true,
      });

      const formData = new FormData();
      formData.append("first_name", firstName);
      formData.append("last_name", lastName);
      formData.append("email", email);
      formData.append("department", department);
      formData.append("year", year);

      if (profileImageFile) {
        formData.append("profile_image", profileImageFile);
      }

      await axios.post(
        "/api/profile/update/",
        formData,
        {
          withCredentials: true,
          headers: {
            "X-CSRFToken": csrfResponse.data.csrfToken,
          },
        }
      );

      navigate("/profile");
    } catch (error) {
      const errorData = error.response?.data;
      let errorMessage = "Unable to save profile. Please try again.";

      if (errorData) {
        if (typeof errorData === "string") {
          errorMessage = errorData;
        } else if (typeof errorData === "object") {
          const firstField = Object.keys(errorData)[0];
          if (firstField && Array.isArray(errorData[firstField])) {
            errorMessage = errorData[firstField][0];
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        }
      }

      setError(errorMessage);
    }
  }

  if (loading) {
    return (
      <div className="page-card">
        <h2>Loading profile data...</h2>
      </div>
    );
  }

  return (
    <div className="page-card">
      <div className="page-card-header">
        <h1 className="page-heading">Edit Profile</h1>
        <p className="page-subtitle">
          Update your student details and save the latest contact information.
        </p>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label className="label">Profile picture</label>
          <input
            className="input"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setProfileImageFile(file || null);
              setProfileImageUrl(file ? URL.createObjectURL(file) : profileImageUrl);
            }}
          />
          {profileImageUrl && (
            <img
              className="image-preview"
              src={profileImageUrl}
              alt="Current profile"
            />
          )}
        </div>
        <div className="form-group">
          <label className="label">First Name</label>
          <input
            className="input"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter first name"
          />
        </div>
        <div className="form-group">
          <label className="label">Last Name</label>
          <input
            className="input"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Enter last name"
          />
        </div>
        <div className="form-group">
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
          />
        </div>
        <div className="form-group">
          <label className="label">Department</label>
          <input
            className="input"
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Enter department"
          />
        </div>
        <div className="form-group">
          <label className="label">Year</label>
          <input
            className="input"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="Enter academic year"
          />
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="actions">
        <button className="button button-primary" type="button" onClick={saveProfile}>
          Save changes
        </button>
        <Link className="button button-secondary" to="/profile">
          Cancel
        </Link>
      </div>
    </div>
  );
}

export default EditProfile;
