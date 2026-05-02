import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../../api.js";
import { FiMail, FiLock, FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const normalizedEmail = String(email || "").trim().toLowerCase();
      const res = await API.post("/login", { email: normalizedEmail, password });
      
      // Store token and user info
      if (res.data.token) localStorage.setItem('token', res.data.token);
      if (res.data.user) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
        if (res.data.user.name) localStorage.setItem('userName', res.data.user.name);
        if (res.data.user.id) localStorage.setItem('userId', res.data.user.id);
      }
      
      // Notify app about auth change so UI updates (navbar, routes)
      window.dispatchEvent(new Event('authChanged'));
      // Navigate based on role
      const role = res.data.user?.role || '';
      if (/moderator/i.test(role)) {
        navigate('/moderator-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        setError("Backend login route not found. Check server URL/port and run backend.");
      } else {
        setError(err.response?.data?.error || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9F9F9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', color: '#1A1A1A', textDecoration: 'none', marginBottom: '2rem', fontSize: '0.9rem', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>
          <FiArrowLeft style={{ marginRight: '0.5rem' }} /> Back
        </Link>
        
        <div style={{ backgroundColor: '#FFF', padding: '3rem', border: '1px solid #EAEAEA' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '400', color: '#1A1A1A', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>Welcome Back</h2>
            <p style={{ color: '#888', margin: 0, fontSize: '0.9rem' }}>Sign in to continue to Samaaj.</p>
          </div>

          {error && (
            <div style={{ backgroundColor: '#FFF0F0', border: '1px solid #FFD0D0', color: '#D8000C', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#1A1A1A', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Email</label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #EAEAEA', backgroundColor: '#FFF' }}>
                <span style={{ padding: '0.8rem', color: '#888', display: 'flex' }}><FiMail /></span>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{ flex: 1, border: 'none', padding: '0.8rem', outline: 'none', width: '100%', fontSize: '0.9rem' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#1A1A1A', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Password</label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #EAEAEA', backgroundColor: '#FFF' }}>
                <span style={{ padding: '0.8rem', color: '#888', display: 'flex' }}><FiLock /></span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ flex: 1, border: 'none', padding: '0.8rem', outline: 'none', width: '100%', fontSize: '0.9rem' }}
                />
                <span onClick={() => setShowPassword(!showPassword)} style={{ padding: '0.8rem', color: '#888', cursor: 'pointer', display: 'flex' }}>
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </span>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{ width: '100%', padding: '1rem', backgroundColor: '#1A1A1A', color: '#FFF', border: 'none', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#888' }}>
              Don't have an account? <Link to="/signup" style={{ color: '#1A1A1A', fontWeight: '600', textDecoration: 'none' }}>Sign Up</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
