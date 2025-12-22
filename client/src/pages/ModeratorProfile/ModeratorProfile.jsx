import React, { useEffect, useState } from "react";
import { toastError } from "../../utils/toast";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ModeratorSidebar from "../../components/ModeratorSidebar";
import { FiUser, FiMail, FiTag, FiCalendar, FiFileText, FiMapPin, FiPhone } from 'react-icons/fi';

const ModeratorProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [departmentInfo, setDepartmentInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = JSON.parse(localStorage.getItem("user"));

    if (!token || !storedUser || !/moderator/i.test(storedUser.role || '')) {
      toastError("Please login as a moderator");
      navigate("/login");
      return;
    }

    setLoading(true);
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL || 'https://samaaj-backend-kj3r.onrender.com'}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log("Profile data:", res.data);
        const userData = res.data.user;
        setProfile(userData);

        // Handle department - could be object, string ID, or string name
        const dept = userData?.department || userData?.departmentId;
        if (dept) {
          if (typeof dept === 'object' && dept.name) {
            // Already populated with department object
            setDepartmentInfo(dept);
          } else if (typeof dept === 'string') {
            // Could be ID or name - try to fetch by ID first
            return axios.get(`${import.meta.env.VITE_BACKEND_URL || 'https://samaaj-backend-kj3r.onrender.com'}/api/complaints/departments/${dept}`)
              .catch(() => {
                // If fetch fails, assume it's already the name
                setDepartmentInfo({ name: dept });
              });
          }
        }
      })
      .then((deptRes) => {
        if (deptRes?.data) {
          setDepartmentInfo(deptRes.data);
        }
      })
      .catch((err) => {
        console.error("Error fetching profile or department:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          toastError("Session expired. Please login again.");
          navigate("/login");
        } else {
          setError(err.response?.data?.message || "Failed to load profile.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="d-flex" style={{ minHeight: "100vh", backgroundColor: "#f5f7fa" }}>
        <ModeratorSidebar />
        <div className="flex-grow-1 d-flex align-items-center justify-content-center">
          <div className="text-center">
            <div className="spinner-border" style={{ width: "3rem", height: "3rem", color: "#FFB347" }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <div className="mt-3 fw-semibold" style={{ color: "#616161", fontSize: "1.1rem" }}>
              Loading profile...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex" style={{ minHeight: "100vh", backgroundColor: "#f5f7fa" }}>
        <ModeratorSidebar />
        <div className="flex-grow-1 d-flex align-items-center justify-content-center p-4">
          <div className="card border-0 shadow-sm" style={{ maxWidth: "500px", width: "100%" }}>
            <div className="card-body text-center p-5">
              <h4 className="mb-3 fw-bold" style={{ color: "#D32F2F" }}>Error Loading Profile</h4>
              <p className="text-muted mb-4">{error}</p>
              <button 
                className="btn fw-semibold px-4"
                style={{ backgroundColor: "#FFB347", color: "#1a1a1a", border: "none" }}
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex" style={{ minHeight: "100vh", backgroundColor: "#f5f7fa" }}>
      <ModeratorSidebar />
      
      <div className="flex-grow-1" style={{ overflow: "auto" }}>
        {/* Header */}
        <section className="py-3 px-4 bg-white border-bottom sticky-top shadow-sm">
          <div>
            <h4 className="mb-1 fw-bold" style={{ color: "#1a1a1a" }}>My Profile</h4>
            <p className="mb-0 small" style={{ color: "#424242" }}>
              View and manage your moderator information
            </p>
          </div>
        </section>

        {/* Profile Content */}
        <section className="py-4 px-4">
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
                        {profile?.name || "Moderator"}
                      </h5>
                      <p className="mb-0 small" style={{ color: "#616161" }}>
                        Active Moderator
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
                          <FiTag style={{ color: "#FFB347" }} />
                        </div>
                        <div>
                          <p className="mb-1 small text-muted">Role</p>
                          <p className="mb-0 fw-semibold">{profile?.role || "Moderator"}</p>
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
                          <p className="mb-1 small text-muted">Department</p>
                          <p className="mb-0 fw-semibold">{departmentInfo?.name || "Not Assigned"}</p>
                          {departmentInfo?.subcategory && (
                            <p className="mb-0 small text-muted">{departmentInfo.subcategory}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {departmentInfo?.coverageAreas && departmentInfo.coverageAreas.length > 0 && (
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
                            <p className="mb-1 small text-muted">Coverage Areas</p>
                            <p className="mb-0 fw-semibold">{departmentInfo.coverageAreas.join(', ')}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {departmentInfo?.moderatorAuthority && (
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
                            <p className="mb-1 small text-muted">Authority</p>
                            <p className="mb-0 fw-semibold">{departmentInfo.moderatorAuthority}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {departmentInfo?.contactInfo && (
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
                            <FiPhone style={{ color: "#FFB347" }} />
                          </div>
                          <div>
                            <p className="mb-1 small text-muted">Contact</p>
                            <p className="mb-0 fw-semibold">{departmentInfo.contactInfo}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {profile?.assignedArea && (
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
                            <p className="mb-1 small text-muted">Assigned Area</p>
                            <p className="mb-0 fw-semibold">{profile.assignedArea}</p>
                          </div>
                        </div>
                      </div>
                    )}

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
                          <p className="mb-1 small text-muted">Assigned Complaints</p>
                          <p className="mb-0 fw-semibold">
                            {profile?.assignedComplaints?.length || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="col-12 mt-4">
                      <div className="alert mb-0" style={{ backgroundColor: "#FFF8F0", border: "1px solid #FFB347" }}>
                        <p className="mb-0 small" style={{ color: "#424242" }}>
                          <strong>Note:</strong> This profile displays your moderator information. 
                          To update your details, please contact system administrator.
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

export default ModeratorProfile;
