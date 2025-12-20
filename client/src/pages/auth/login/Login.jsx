import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
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
      const res = await axios.post("http://localhost:3000/login", { email, password }, { withCredentials: true });
      
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
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5 col-xl-4">
            <Link to="/" className="btn btn-link text-decoration-none mb-3" style={{ color: '#616161' }}>
              <FiArrowLeft className="me-2" />
              Back to Home
            </Link>
            
            <div className="card border-0 shadow-lg" style={{ borderRadius: '20px' }}>
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <h2 className="fw-bold mb-2" style={{ color: '#1a1a1a' }}>Welcome Back</h2>
                  <p style={{ color: '#616161' }}>Sign in to continue to Samaaj</p>
                </div>

                {error && (
                  <div className="alert alert-danger d-flex align-items-center" style={{ borderRadius: '12px' }}>
                    <i className="bi bi-exclamation-circle me-2"></i>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
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
                        onChange={e => setEmail(e.target.value)}
                        required
                        style={{ border: '2px solid #e0e0e0', borderLeft: 'none', borderRadius: '0 12px 12px 0', padding: '0.75rem' }}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold" style={{ color: '#424242' }}>Password</label>
                    <div className="input-group">
                      <span className="input-group-text bg-white" style={{ border: '2px solid #e0e0e0', borderRight: 'none', borderRadius: '12px 0 0 12px' }}>
                        <FiLock style={{ color: '#616161' }} />
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control"
                        placeholder="Enter your password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        style={{ border: '2px solid #e0e0e0', borderLeft: 'none', borderRight: 'none', padding: '0.75rem' }}
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

                  <button 
                    type="submit" 
                    className="btn btn-lg w-100 mb-3"
                    disabled={loading}
                    style={{ backgroundColor: '#FFB347', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', padding: '0.75rem' }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Signing in...
                      </>
                    ) : 'Sign In'}
                  </button>

                  <div className="text-center">
                    <p className="mb-0" style={{ color: '#616161' }}>
                      Don't have an account? <Link to="/signup" style={{ color: '#FFB347', fontWeight: '600', textDecoration: 'none' }}>Sign Up</Link>
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

export default Login;
