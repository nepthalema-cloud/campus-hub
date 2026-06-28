import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function CreateProfile() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");

  async function createProfile() {
    try {
      const csrfResponse = await axios.get(
        "/api/csrf/",
        {
          withCredentials: true,
        }
      );

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
        "/api/profile/create/",
        formData,
        {
          withCredentials: true,
          headers: {
            "X-CSRFToken": csrfResponse.data.csrfToken,
          },
        }
      );

      navigate("/dashboard");
    } catch (err) {
      const errorData = err.response?.data;
      let errorMessage = "Failed to create profile";

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

  return (
    <div className="page-card">
      <div className="page-card-header">
        <h1 className="page-heading">Create your student profile</h1>
        <p className="page-subtitle">
          Complete your profile so you can access the dashboard and manage your student information.
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
              setPreviewUrl(file ? URL.createObjectURL(file) : "");
            }}
          />
          {previewUrl && (
            <img
              className="image-preview"
              src={previewUrl}
              alt="Profile preview"
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
        <button className="button button-primary" type="button" onClick={createProfile}>
          Create Profile
        </button>
      </div>
    </div>
  );
}

export default CreateProfile;
