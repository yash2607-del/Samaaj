import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { FiUser, FiMail, FiLock, FiMapPin, FiTag, FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';
import "./signup.css";

function Signup() {
  const [role, setRole] = useState("Citizen");
  const [department, setDepartment] = useState("");
  const [departments, setDepartments] = useState([]);
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [assignedArea, setAssignedArea] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const fetchDepartments = async () => {
      try {
        const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/complaints/departments`);
        if (!mounted) return;
        if (!resp.ok) return;
        const data = await resp.json();
        const list = Array.isArray(data) ? data : (data.data || data);
        setDepartments(list || []);
      } catch (err) {
        console.error('Failed to load departments for signup:', err);
      }
    };
    fetchDepartments();
    return () => { mounted = false; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!fullName || !email || !password || !confirmPassword) {
      setError("Please fill all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (role === "Citizen" && !location) {
      setError("Please fill all citizen fields.");
      return;
    }
    if (role === "Moderator" && (!department || !assignedArea)) {
      setError("Please fill all moderator fields.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/signup`, {
        role,
        department,
        name: fullName,
        location,
        assignedArea,
        email,
        password
      });
      
      setSuccess("Account created successfully! Redirecting to login...");
      setError("");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      setError(error.response?.data?.error || "Signup failed. Please try again.");
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (selectedRole) => {
    setRole(selectedRole);
    setDepartment("");
    setAssignedArea("");
    setLocation("");
  };

  return (
    <div className="auth-page signup-page" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <Link to="/" className="btn btn-link text-decoration-none mb-3" style={{ color: '#616161' }}>
              <FiArrowLeft className="me-2" />
              Back to Home
            </Link>
            
            <div className="card border-0 shadow-lg" style={{ borderRadius: '20px' }}>
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <h2 className="fw-bold mb-2" style={{ color: '#1a1a1a' }}>Create Account</h2>
                  <p style={{ color: '#616161' }}>Join Samaaj and make a difference</p>
                </div>

                {/* Role Toggle */}
                <div className="mb-4">
                  <div className="btn-group w-100" role="group">
                    <button
                      type="button"
                      className={`btn ${role === "Citizen" ? "" : "btn-outline-primary"}`}
                      onClick={() => toggleRole("Citizen")}
                      style={role === "Citizen" ? { 
                        backgroundColor: '#FFB347', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '12px 0 0 12px',
                        fontWeight: '600'
                      } : {
                        borderColor: '#e0e0e0',
                        color: '#616161',
                        borderRadius: '12px 0 0 12px'
                      }}
                    >
                      Citizen
                    </button>
                    <button
                      type="button"
                      className={`btn ${role === "Moderator" ? "" : "btn-outline-primary"}`}
                      onClick={() => toggleRole("Moderator")}
                      style={role === "Moderator" ? { 
                        backgroundColor: '#FFB347', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '0 12px 12px 0',
                        fontWeight: '600'
                      } : {
                        borderColor: '#e0e0e0',
                        color: '#616161',
                        borderRadius: '0 12px 12px 0'
                      }}
                    >
                      Moderator
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="alert alert-danger d-flex align-items-center" style={{ borderRadius: '12px' }}>
                    <i className="bi bi-exclamation-circle me-2"></i>
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="alert alert-success d-flex align-items-center" style={{ borderRadius: '12px' }}>
                    <i className="bi bi-check-circle me-2"></i>
                    <span>{success}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Common Fields */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ color: '#424242' }}>Full Name</label>
                    <div className="input-group">
                      <span className="input-group-text bg-white" style={{ border: '2px solid #e0e0e0', borderRight: 'none', borderRadius: '12px 0 0 12px' }}>
                        <FiUser style={{ color: '#616161' }} />
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        style={{ border: '2px solid #e0e0e0', borderLeft: 'none', borderRadius: '0 12px 12px 0' }}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold" style={{ color: '#424242' }}>Email Address</label>
                    <div className="input-group">
                      <span className="input-group-text bg-white" style={{ border: '2px solid #e0e0e0', borderRight: 'none', borderRadius: '12px 0 0 12px' }}>
                        <FiMail style={{ color: '#616161' }} />
                      </span>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ border: '2px solid #e0e0e0', borderLeft: 'none', borderRadius: '0 12px 12px 0' }}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold" style={{ color: '#424242' }}>Password</label>
                      <div className="input-group">
                        <span className="input-group-text bg-white" style={{ border: '2px solid #e0e0e0', borderRight: 'none', borderRadius: '12px 0 0 12px' }}>
                          <FiLock style={{ color: '#616161' }} />
                        </span>
                        <input
                          type={showPassword ? "text" : "password"}
                          className="form-control"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          style={{ border: '2px solid #e0e0e0', borderLeft: 'none', borderRight: 'none' }}
                        />
                        <span 
                          className="input-group-text bg-white" 
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ border: '2px solid #e0e0e0', borderLeft: 'none', borderRadius: '0 12px 12px 0', cursor: 'pointer' }}
                        >
                          {showPassword ? <FiEyeOff style={{ color: '#616161' }} /> : <FiEye style={{ color: '#616161' }} />}
                        </span>
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold" style={{ color: '#424242' }}>Confirm Password</label>
                      <div className="input-group">
                        <span className="input-group-text bg-white" style={{ border: '2px solid #e0e0e0', borderRight: 'none', borderRadius: '12px 0 0 12px' }}>
                          <FiLock style={{ color: '#616161' }} />
                        </span>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          className="form-control"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          style={{ border: '2px solid #e0e0e0', borderLeft: 'none', borderRight: 'none' }}
                        />
                        <span 
                          className="input-group-text bg-white" 
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={{ border: '2px solid #e0e0e0', borderLeft: 'none', borderRadius: '0 12px 12px 0', cursor: 'pointer' }}
                        >
                          {showConfirmPassword ? <FiEyeOff style={{ color: '#616161' }} /> : <FiEye style={{ color: '#616161' }} />}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Role-Specific Fields */}
                  {role === "Citizen" && (
                    <>
                      <div className="mb-3">
                        <label className="form-label fw-semibold" style={{ color: '#424242' }}>District (Delhi)</label>
                        <div className="input-group">
                          <span className="input-group-text bg-white" style={{ border: '2px solid #e0e0e0', borderRight: 'none', borderRadius: '12px 0 0 12px' }}>
                            <FiMapPin style={{ color: '#616161' }} />
                          </span>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g., South Delhi"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            required
                            style={{ border: '2px solid #e0e0e0', borderLeft: 'none', borderRadius: '0 12px 12px 0' }}
                          />
                        </div>
                      </div>

                    </>
                  )}

                  {role === "Moderator" && (
                    <>
                      <div className="mb-3">
                        <label className="form-label fw-semibold" style={{ color: '#424242' }}>Department</label>
                        <div className="input-group">
                          <span className="input-group-text bg-white" style={{ border: '2px solid #e0e0e0', borderRight: 'none', borderRadius: '12px 0 0 12px' }}>
                            <FiTag style={{ color: '#616161' }} />
                          </span>
                          <select
                            className="form-select"
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            required
                            style={{ border: '2px solid #e0e0e0', borderLeft: 'none', borderRadius: '0 12px 12px 0' }}
                          >
                                <option value="">Select Department</option>
                                {departments.map(d => (
                                  <option key={d._id || d.name} value={d._id || d.name}>{d.name}{d.category ? ` — ${d.category}` : ''}</option>
                                ))}
                          </select>
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold" style={{ color: '#424242' }}>Assigned District/Zone (Delhi)</label>
                        <div className="input-group">
                          <span className="input-group-text bg-white" style={{ border: '2px solid #e0e0e0', borderRight: 'none', borderRadius: '12px 0 0 12px' }}>
                            <FiMapPin style={{ color: '#616161' }} />
                          </span>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g., South Delhi"
                            value={assignedArea}
                            onChange={(e) => setAssignedArea(e.target.value)}
                            required
                            style={{ border: '2px solid #e0e0e0', borderLeft: 'none', borderRadius: '0 12px 12px 0' }}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <button 
                    type="submit" 
                    className="btn btn-lg w-100 mb-3"
                    disabled={loading}
                    style={{ backgroundColor: '#FFB347', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600' }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Creating Account...
                      </>
                    ) : 'Sign Up'}
                  </button>

                  <div className="text-center">
                    <p className="mb-0" style={{ color: '#616161' }}>
                      Already have an account? <Link to="/login" style={{ color: '#FFB347', fontWeight: '600', textDecoration: 'none' }}>Login</Link>
                    </p>
                  </div>
                </form>
              </div>
            </div>

            <div className="text-center mt-3">
              <small style={{ color: '#616161' }}>
                © 2025 Samaaj. All rights reserved.
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
