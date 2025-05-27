import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import './signup.css';
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";

function Signup() {
  const [role, setRole] = useState("Citizen");
  const [department, setDepartment] = useState("");
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [issueCategory, setIssueCategory] = useState("");
  const [assignedArea, setAssignedArea] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Basic validation
    if (!fullName || !email || !password || !confirmPassword) {
      setError("Please fill all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (role === "Citizen" && (!location || !issueCategory)) {
      setError("Please fill all citizen fields.");
      return;
    }
    if (role === "Moderator" && (!department || !assignedArea)) {
      setError("Please fill all moderator fields.");
      return;
    }

    axios.post("http://localhost:3000/signup", {
      role,
      department,
      name: fullName,
      location,
      issueCategory,
      assignedArea,
      email,
      password
    })
    .then(response => {
      setSuccess("Signup successful!");
      setError("");
      setTimeout(() => {
        navigate("/login");
      }, 1500); // 1.5s delay for user to see the message
    })
    .catch(error => {
      setError(error.response?.data?.error || "Signup failed.");
      setSuccess("");
    });
  };

  const toggleRole = (selectedRole) => {
    setRole(selectedRole);
    setDepartment("");
    setAssignedArea("");
    setLocation("");
    setIssueCategory("");
  };

  return (
    <section className="wrapper">
      <div className="container">
        <div className="col-sm-8 offset-sm-2 col-lg-6 offset-lg-3 col-xl-4 offset-xl-4 text-center">
          <form className="rounded bg-white shadow p-5" onSubmit={handleSubmit}>
            <h6 className="text-dark fw-bolder fs-4 mb-2">Sign Up as</h6>

            <div className="btn-group w-100 mb-4" role="group">
              <button
                type="button"
                className={`btn ${role === "Moderator" ? "btn-warning" : "btn-outline-warning"}`}
                onClick={() => toggleRole("Moderator")}
              >
                Moderator
              </button>
              <button
                type="button"
                className={`btn ${role === "Citizen" ? "btn-warning" : "btn-outline-warning"}`}
                onClick={() => toggleRole("Citizen")}
              >
                Citizen
              </button>
            </div>

            {error && <div className="alert alert-danger py-2">{error}</div>}
            {success && <div className="alert alert-success py-2">{success}</div>}

            {/* Common Fields */}
            <div className="form-floating mb-3">
              <input
                type="text"
                className="form-control"
                id="fullNameInput"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <label htmlFor="fullNameInput">Full Name</label>
            </div>

            <div className="form-floating mb-3">
              <input
                type="email"
                className="form-control"
                id="floatingEmail"
                placeholder="xyz@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <label htmlFor="floatingEmail">Email Address</label>
            </div>

            <div className="form-floating mb-3">
              <input
                type="password"
                className="form-control"
                id="floatingPassword"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <label htmlFor="floatingPassword">Password</label>
            </div>

            <div className="form-floating mb-3">
              <input
                type="password"
                className="form-control"
                id="floatingConfirmPassword"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <label htmlFor="floatingConfirmPassword">Confirm Password</label>
            </div>

            {/* Moderator Fields */}
            {role === "Moderator" && (
              <>
                <div className="form-floating mb-3">
                  <select
                    className="form-select"
                    id="departmentSelect"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select Department</option>
                    <option>Electricity</option>
                    <option>Road</option>
                    <option>Water</option>
                    <option>Sanitation</option>
                    <option>Public Safety</option>
                  </select>
                  <label htmlFor="departmentSelect">Department</label>
                </div>

                <div className="form-floating mb-3">
                  <input
                    type="text"
                    className="form-control"
                    id="areaInput"
                    placeholder="Assigned Area/Zone"
                    value={assignedArea}
                    onChange={(e) => setAssignedArea(e.target.value)}
                    required
                  />
                  <label htmlFor="areaInput">Assigned Area/Zone</label>
                </div>
              </>
            )}

            {/* Citizen Fields */}
            {role === "Citizen" && (
              <>
                <div className="form-floating mb-3">
                  <input
                    type="text"
                    className="form-control"
                    id="locationInput"
                    placeholder="Enter your location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                  />
                  <label htmlFor="locationInput">Location</label>
                </div>

                <div className="form-floating mb-3">
                  <select
                    className="form-select"
                    id="issueCategory"
                    value={issueCategory}
                    onChange={(e) => setIssueCategory(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select Issue Category</option>
                    <option>Electricity</option>
                    <option>Road</option>
                    <option>Water</option>
                    <option>Sanitation</option>
                    <option>Public Safety</option>
                  </select>
                  <label htmlFor="issueCategory">Issue Category</label>
                </div>
              </>
            )}

            <button type="submit" className="btn btn-warning mb-3 w-100">Sign Up</button>

            <p className="mt-2 text-center text-sm text-gray-600 mb-0">
              Already have an account?
              <a className="sign-in" href="/login"> Login</a>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

export default Signup;