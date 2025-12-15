import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiUser, FiMail, FiMapPin, FiTag, FiCalendar, FiFileText, FiArrowLeft } from "react-icons/fi";
import CitizenSidebar from "../../components/CitizenSidebar";

const UserProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [complaintCount, setComplaintCount] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No authentication token found. Please log in.");
          setLoading(false);
          return;
        }

        const response = await axios.get("http://localhost:3000/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setProfile(response.data.user);

        // Fetch complaint count
        const userId = response.data.user.userId || response.data.user._id;
        const complaintsResponse = await axios.get("http://localhost:3000/api/complaints", {
          params: { userId },
          headers: { Authorization: `Bearer ${token}` },
        });
        setComplaintCount(complaintsResponse.data?.data?.length || 0);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError(err.response?.data?.error || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="d-flex" style={{ minHeight: "100vh", backgroundColor: "#f5f7fa" }}>
        <CitizenSidebar />
        <div className="flex-grow-1 d-flex align-items-center justify-content-center">
          <div className="spinner-border" style={{ color: "#FFB347" }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex" style={{ minHeight: "100vh", backgroundColor: "#f5f7fa" }}>
        <CitizenSidebar />
        <div className="flex-grow-1 d-flex align-items-center justify-content-center">
          <div className="alert alert-danger">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex" style={{ minHeight: "100vh", backgroundColor: "#f5f7fa" }}>
      <CitizenSidebar />
      <div className="flex-grow-1" style={{ overflow: "auto", backgroundColor: "#f5f7fa" }}>
        {/* Header */}
        <section
          className="py-3 px-4 bg-white border-bottom"
          style={{ position: "sticky", top: 0, zIndex: 100 }}
        >
          <div className="d-flex align-items-center">
            <button
              className="btn btn-sm me-3"
              onClick={() => navigate("/dashboard")}
              style={{ backgroundColor: "white", border: "none" }}
            >
              <FiArrowLeft style={{ fontSize: "1.2rem", color: "#1a1a1a" }} />
            </button>
            <div>
              <h4 className="mb-1 fw-bold" style={{ color: "#1a1a1a" }}>My Profile</h4>
              <p className="mb-0 small" style={{ color: "#424242" }}>
                View and manage your account information
              </p>
            </div>
          </div>
        </section>

        {/* Profile Content */}
        <section className="py-4 px-4" style={{ backgroundColor: "#f5f7fa" }}>
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm" style={{ borderRadius: "12px" }}>
                <div className="card-body p-4">
                  <div className="d-flex align-items-center mb-4 pb-3" style={{ borderBottom: "2px solid #f5f7fa" }}>
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center me-3"
                      style={{
                        width: "70px",
                        height: "70px",
                        background: "linear-gradient(135deg, #FFB347 0%, #FFD8A8 100%)",
                      }}
                    >
                      <FiUser style={{ fontSize: "2rem", color: "white" }} />
                    </div>
                    <div>
                      <h5 className="mb-0 fw-bold" style={{ color: "#1a1a1a" }}>
                        {profile?.name || "Citizen"}
                      </h5>
                      <p className="mb-0 small" style={{ color: "#616161" }}>
                        Active Citizen
                      </p>
                    </div>
                  </div>

                  <div className="row g-4">
                    {/* Personal Information */}
                    <div className="col-12">
                      <h6 className="fw-semibold mb-3" style={{ color: "#1a1a1a" }}>
                        Personal Information
                      </h6>
                    </div>

                    <div className="col-md-6">
                      <div className="d-flex align-items-start">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center me-3"
                          style={{
                            width: "40px",
                            height: "40px",
                            backgroundColor: "#FFF8F0",
                            flexShrink: 0,
                          }}
                        >
                          <FiUser style={{ color: "#FFB347" }} />
                        </div>
                        <div>
                          <p className="mb-1 small text-muted">Full Name</p>
                          <p className="mb-0 fw-semibold">{profile?.name || "N/A"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="d-flex align-items-start">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center me-3"
                          style={{
                            width: "40px",
                            height: "40px",
                            backgroundColor: "#FFF8F0",
                            flexShrink: 0,
                          }}
                        >
                          <FiMail style={{ color: "#FFB347" }} />
                        </div>
                        <div>
                          <p className="mb-1 small text-muted">Email Address</p>
                          <p className="mb-0 fw-semibold">{profile?.email || "N/A"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="d-flex align-items-start">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center me-3"
                          style={{
                            width: "40px",
                            height: "40px",
                            backgroundColor: "#FFF8F0",
                            flexShrink: 0,
                          }}
                        >
                          <FiMapPin style={{ color: "#FFB347" }} />
                        </div>
                        <div>
                          <p className="mb-1 small text-muted">District (Delhi)</p>
                          <p className="mb-0 fw-semibold">{profile?.location || "Not Set"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="d-flex align-items-start">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center me-3"
                          style={{
                            width: "40px",
                            height: "40px",
                            backgroundColor: "#FFF8F0",
                            flexShrink: 0,
                          }}
                        >
                          <FiTag style={{ color: "#FFB347" }} />
                        </div>
                        <div>
                          <p className="mb-1 small text-muted">Primary Interest</p>
                          <p className="mb-0 fw-semibold">
                            {profile?.issueCategory || "Not Specified"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="d-flex align-items-start">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center me-3"
                          style={{
                            width: "40px",
                            height: "40px",
                            backgroundColor: "#FFF8F0",
                            flexShrink: 0,
                          }}
                        >
                          <FiCalendar style={{ color: "#FFB347" }} />
                        </div>
                        <div>
                          <p className="mb-1 small text-muted">Member Since</p>
                          <p className="mb-0 fw-semibold">
                            {formatDate(profile?.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="d-flex align-items-start">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center me-3"
                          style={{
                            width: "40px",
                            height: "40px",
                            backgroundColor: "#FFF8F0",
                            flexShrink: 0,
                          }}
                        >
                          <FiFileText style={{ color: "#FFB347" }} />
                        </div>
                        <div>
                          <p className="mb-1 small text-muted">Submitted Complaints</p>
                          <p className="mb-0 fw-semibold">{complaintCount}</p>
                        </div>
                      </div>
                    </div>

                    <div className="col-12 mt-4">
                      <div className="alert mb-0" style={{ backgroundColor: "#FFF8F0", border: "1px solid #FFB347" }}>
                        <p className="mb-0 small" style={{ color: "#424242" }}>
                          <strong>Note:</strong> This profile displays complaints from your district ({profile?.location || "your area"}). 
                          To update your information, please contact support.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default UserProfile;
