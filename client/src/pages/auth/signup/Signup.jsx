import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FiUser, FiMail, FiLock, FiTag, FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';
import { MapPin } from 'lucide-react';

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
    <div style={{ minHeight: '100vh', backgroundColor: '#F9F9F9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '600px' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', color: '#1A1A1A', textDecoration: 'none', marginBottom: '2rem', fontSize: '0.9rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>
          <FiArrowLeft style={{ marginRight: '0.5rem' }} /> Back
        </Link>
        
        <div style={{ backgroundColor: '#FFF', padding: '3rem', border: '1px solid #EAEAEA' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '400', color: '#1A1A1A', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>Create Account</h2>
            <p style={{ color: '#888', margin: 0, fontSize: '0.9rem' }}>Join Samaaj and make a difference.</p>
          </div>

          <div style={{ display: 'flex', marginBottom: '2rem', border: '1px solid #EAEAEA' }}>
            <button
              type="button"
              onClick={() => toggleRole("Citizen")}
              style={{ flex: 1, padding: '0.8rem', border: 'none', backgroundColor: role === "Citizen" ? '#1A1A1A' : '#FFF', color: role === "Citizen" ? '#FFF' : '#888', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer' }}
            >
              Citizen
            </button>
            <button
              type="button"
              onClick={() => toggleRole("Moderator")}
              style={{ flex: 1, padding: '0.8rem', border: 'none', backgroundColor: role === "Moderator" ? '#1A1A1A' : '#FFF', color: role === "Moderator" ? '#FFF' : '#888', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', cursor: 'pointer' }}
            >
              Moderator
            </button>
          </div>

          {error && (
            <div style={{ backgroundColor: '#FFF0F0', border: '1px solid #FFD0D0', color: '#D8000C', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ backgroundColor: '#F0FFF0', border: '1px solid #D0FFD0', color: '#008000', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#1A1A1A', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Full Name</label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #EAEAEA', backgroundColor: '#FFF' }}>
                <span style={{ padding: '0.8rem', color: '#888', display: 'flex' }}><FiUser /></span>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  style={{ flex: 1, border: 'none', padding: '0.8rem', outline: 'none', width: '100%', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#1A1A1A', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Email Address</label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #EAEAEA', backgroundColor: '#FFF' }}>
                <span style={{ padding: '0.8rem', color: '#888', display: 'flex' }}><FiMail /></span>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ flex: 1, border: 'none', padding: '0.8rem', outline: 'none', width: '100%', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#1A1A1A', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Password</label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #EAEAEA', backgroundColor: '#FFF' }}>
                  <span style={{ padding: '0.8rem', color: '#888', display: 'flex' }}><FiLock /></span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ flex: 1, border: 'none', padding: '0.8rem', outline: 'none', width: '100%', fontSize: '0.9rem' }}
                  />
                  <span onClick={() => setShowPassword(!showPassword)} style={{ padding: '0.8rem', color: '#888', cursor: 'pointer', display: 'flex' }}>
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </span>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#1A1A1A', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Confirm Password</label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #EAEAEA', backgroundColor: '#FFF' }}>
                  <span style={{ padding: '0.8rem', color: '#888', display: 'flex' }}><FiLock /></span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{ flex: 1, border: 'none', padding: '0.8rem', outline: 'none', width: '100%', fontSize: '0.9rem' }}
                  />
                  <span onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ padding: '0.8rem', color: '#888', cursor: 'pointer', display: 'flex' }}>
                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                  </span>
                </div>
              </div>
            </div>

            {role === "Citizen" && (
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#1A1A1A', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>District (Delhi)</label>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #EAEAEA', backgroundColor: '#FFF' }}>
                  <span style={{ padding: '0.8rem', color: '#888', display: 'flex' }}><MapPin /></span>
                  <input
                    type="text"
                    placeholder="e.g., South Delhi"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    style={{ flex: 1, border: 'none', padding: '0.8rem', outline: 'none', width: '100%', fontSize: '0.9rem' }}
                  />
                </div>
              </div>
            )}

            {role === "Moderator" && (
              <>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#1A1A1A', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Department</label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #EAEAEA', backgroundColor: '#FFF' }}>
                    <span style={{ padding: '0.8rem', color: '#888', display: 'flex' }}><FiTag /></span>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                      style={{ flex: 1, border: 'none', padding: '0.8rem', outline: 'none', width: '100%', fontSize: '0.9rem', backgroundColor: 'transparent' }}
                    >
                      <option value="">Select Department</option>
                      {departments.map(d => (
                        <option key={d._id || d.name} value={d._id || d.name}>{d.name}{d.category ? ` — ${d.category}` : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#1A1A1A', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Assigned District/Zone (Delhi)</label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #EAEAEA', backgroundColor: '#FFF' }}>
                    <span style={{ padding: '0.8rem', color: '#888', display: 'flex' }}><MapPin /></span>
                    <input
                      type="text"
                      placeholder="e.g., South Delhi"
                      value={assignedArea}
                      onChange={(e) => setAssignedArea(e.target.value)}
                      required
                      style={{ flex: 1, border: 'none', padding: '0.8rem', outline: 'none', width: '100%', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>
              </>
            )}

            <button 
              type="submit" 
              disabled={loading}
              style={{ width: '100%', padding: '1rem', backgroundColor: '#1A1A1A', color: '#FFF', border: 'none', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#888' }}>
              Already have an account? <Link to="/login" style={{ color: '#1A1A1A', fontWeight: '600', textDecoration: 'none' }}>Login</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signup;
