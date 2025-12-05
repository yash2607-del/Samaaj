import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    axios.post("http://localhost:3000/login", { email, password })
      .then(res => {
        // store token and user info for authenticated requests
        if (res.data.token) localStorage.setItem('token', res.data.token);
        if (res.data.user) localStorage.setItem('user', JSON.stringify(res.data.user));
        localStorage.setItem('userType', res.data.user?.role || '');
        navigate("/dashboard");
      })
      .catch(err => {
        setError(err.response?.data?.error || "Login failed");
      });
  };

  return (
    <>
      <section className="wrapper">
        <div className="container">
          <div className="col-sm-8 offset-sm-2 col-lg-6 offset-lg-3 col-xl-4 offset-xl-4 text-center">
            <form className="rounded bg-white shadow p-5" onSubmit={handleSubmit}>
              <h1 className="text-dark fw-bolder fs-4 mb-2">Login Form</h1>

              {error && <div className="alert alert-danger py-2">{error}</div>}

              <div className="form-floating mb-3">
                <input
                  type="email"
                  className="form-control"
                  id="floating-input"
                  placeholder="xyz@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <label htmlFor="floatingInput">Email Address</label>
              </div>

              <div className="form-floating mb-3">
                <input
                  type="password"
                  className="form-control"
                  id="floatingPassword"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <label htmlFor="floatingPassword">Password</label>
              </div>

              <div className="btn-group w-100 mb-3">
                <button type="submit" className="btn btn-warning w-100">Login</button>
              </div>

              <p className="mt-2 text-center text-sm text-gray-600 mb-5">
                New Member?
                <a className="sign-in" href="/signup"> Sign Up</a>
              </p>

              <a href='/forgot' className='mt-2 text-center text-sm text-gray-600 mb-5'> Forgot Password?</a>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}

export default Login;