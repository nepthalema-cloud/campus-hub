import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function StudentDirectory() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState("");
  const isInitialLoadRef = useRef(true);
  const profilesRef = useRef([]);
  const searchRef = useRef("");
  const departmentRef = useRef("");
  const yearRef = useRef("");
  const pageRef = useRef(1);

  const getCsrfToken = async () => {
    const response = await axios.get("/api/csrf/", {
      withCredentials: true,
    });
    return response.data.csrfToken;
  };

  const profilesEqual = (oldProfiles, newProfiles) => {
    if (oldProfiles.length !== newProfiles.length) return false;
    return oldProfiles.every((profile, index) => {
      const newProfile = newProfiles[index];
      return (
        profile.id === newProfile.id &&
        profile.connection_status === newProfile.connection_status &&
        profile.first_name === newProfile.first_name &&
        profile.last_name === newProfile.last_name &&
        profile.department === newProfile.department &&
        profile.year === newProfile.year &&
        profile.profile_image === newProfile.profile_image
      );
    });
  };

  async function loadDirectory(pageNumber = pageRef.current) {
    const params = {
      page: pageNumber,
      page_size: pageSize,
    };

    if (searchRef.current) params.search = searchRef.current;
    if (departmentRef.current) params.department = departmentRef.current;
    if (yearRef.current) params.year = yearRef.current;

    try {
      const res = await axios.get("/api/directory/", {
        params,
        withCredentials: true,
      });
      const data = res.data;
      const profilesData = data.results ?? data;
      const newProfiles = Array.isArray(profilesData) ? profilesData : [];
      const totalCount = data.count ?? (Array.isArray(profilesData) ? profilesData.length : 0);
      const newTotalPages = Math.ceil(totalCount / pageSize);

      if (!profilesEqual(profilesRef.current, newProfiles)) {
        setProfiles(newProfiles);
        profilesRef.current = newProfiles;
      }
      if (newTotalPages !== totalPages) {
        setTotalPages(newTotalPages);
      }
    } catch (error) {
      setMessage("Unable to load student directory.");
    } finally {
      if (isInitialLoadRef.current) {
        setLoading(false);
        isInitialLoadRef.current = false;
      }
    }
  }

  const sendConnectionRequest = async (profileId, profile) => {
    setMessage("");
    try {
      const csrfToken = await getCsrfToken();
      await axios.post(
        `/api/connections/send/${profileId}/`,
        {},
        {
          withCredentials: true,
          headers: {
            "X-CSRFToken": csrfToken,
          },
        }
      );
      await loadDirectory();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to send connection request.");
    }
  };

  const cancelConnectionRequest = async (profileId) => {
    setMessage("");
    try {
      const csrfToken = await getCsrfToken();
      await axios.delete(`/api/connections/remove/${profileId}/`, {
        withCredentials: true,
        headers: {
          "X-CSRFToken": csrfToken,
        },
      });
      await loadDirectory();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to cancel request.");
    }
  };

  useEffect(() => {
    searchRef.current = search;
    departmentRef.current = department;
    yearRef.current = year;
    pageRef.current = page;
    loadDirectory(pageRef.current);
    const interval = setInterval(() => {
      loadDirectory(pageRef.current);
    }, 15000);

    return () => clearInterval(interval);
  }, [page, search, department, year]);

  const handleSearch = async (event) => {
    event.preventDefault();
    if (page === 1) {
      await loadDirectory(1);
    } else {
      setPage(1);
    }
  };

  const resetFilters = async () => {
    setSearch("");
    setDepartment("");
    setYear("");
    if (page === 1) {
      await loadDirectory(1);
    } else {
      setPage(1);
    }
  };

  return (
    <div className="page-card">
      <div className="page-card-header">
        <h1 className="page-heading">Student Directory</h1>
        <p className="page-subtitle">
          Browse registered students and filter by name, department, or year.
        </p>
      </div>

      <form className="form-grid" onSubmit={handleSearch}>
        <div className="form-group">
          <label className="label">Search name</label>
          <input
            className="input"
            type="text"
            placeholder="First or last name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="label">Department</label>
          <input
            className="input"
            type="text"
            placeholder="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="label">Year</label>
          <input
            className="input"
            type="number"
            placeholder="Year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </div>
        <div className="actions">
          <button className="button button-primary" type="submit">
            Search
          </button>
          <button
            className="button button-secondary"
            type="button"
            onClick={resetFilters}
          >
            Reset
          </button>
        </div>
      </form>

      <div className="card-grid">
        {loading ? (
          <div className="page-card">
            <h2>Loading students...</h2>
          </div>
        ) : profiles.length === 0 ? (
          <div className="page-card">
            <h2>No students found.</h2>
          </div>
        ) : (
          profiles.map((profile) => {
            const imageUrl = profile.profile_image
              ? profile.profile_image.startsWith("http")
                ? profile.profile_image
                : profile.profile_image
              : null;

            const isConnected = profile.connection_status === "connected";
            const isPendingSent = profile.connection_status === "pending_sent";
            const isPendingReceived = profile.connection_status === "pending_received";
            const isDeclined =
              profile.connection_status === "declined_sent" ||
              profile.connection_status === "declined_received";

            return (
              <div key={profile.id} className="profile-card">
                {imageUrl ? (
                  <div className="avatar avatar-small">
                    <img
                      src={imageUrl}
                      alt={`${profile.first_name} ${profile.last_name}`}
                    />
                  </div>
                ) : (
                  <div className="avatar avatar-small placeholder-avatar">
                    {(profile.first_name || profile.last_name || profile.username || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <h3 className="profile-card-title">
                  {profile.first_name} {profile.last_name}
                </h3>
                <div className="profile-meta">
                  <div className="profile-meta-item">
                    <strong>Username</strong>
                    <span>{profile.username}</span>
                  </div>
                  <div className="profile-meta-item">
                    <strong>Department</strong>
                    <span>{profile.department}</span>
                  </div>
                  <div className="profile-meta-item">
                    <strong>Year</strong>
                    <span>{profile.year}</span>
                  </div>
                </div>
                <div className="actions">
                  {profile.connection_status === "connect" && (
                    <button
                      className="button button-primary"
                      type="button"
                      onClick={() => sendConnectionRequest(profile.user_id, profile)}
                    >
                      Connect
                    </button>
                  )}
                  {(profile.connection_status === "pending" || isPendingSent) && (
                    <button className="button button-secondary" disabled type="button">
                      Request Sent
                    </button>
                  )}
                  {isPendingSent && (
                    <>
                      {profile.id && (
                        <button
                          className="button button-danger"
                          type="button"
                          onClick={() => cancelConnectionRequest(profile.id)}
                        >
                          Cancel
                        </button>
                      )}
                    </>
                  )}
                  {isPendingReceived && (
                    <Link className="button button-primary" to="/connections">
                      Request Received
                    </Link>
                  )}
                  {isConnected && (
                    <button className="button button-secondary" disabled type="button">
                      Connected
                    </button>
                  )}
                  {isDeclined && (
                    <button className="button button-warning" disabled type="button">
                      Declined
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {message && <div className="alert alert-info">{message}</div>}
      <div className="profile-actions">
        <button
          className="button button-secondary"
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page <= 1}
        >
          Previous
        </button>
        <button className="button button-secondary" disabled>
          Page {page} of {totalPages}
        </button>
        <button
          className="button button-secondary"
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={page >= totalPages}
        >
          Next
        </button>
        <Link className="button button-secondary" to="/connections">
          My Connections
        </Link>
        <Link className="button button-primary" to="/dashboard">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default StudentDirectory;
