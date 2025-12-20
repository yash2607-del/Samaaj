import React, { useState, useEffect } from "react";
import { FiUser, FiMail, FiMapPin, FiLock, FiSave } from "react-icons/fi";
import CitizenSidebar from "../../components/CitizenSidebar";
import ModeratorSidebar from "../../components/ModeratorSidebar";
import API from "../../api/axios";
import "./Settings.css";

function Settings() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    location: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    // Load user data
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = localStorage.getItem("userType") || user.role || "";
    
    setUserRole(role);
    setFormData(prev => ({
      ...prev,
      name: user.name || "",
      email: user.email || "",
      location: user.location || ""
    }));
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const userId = localStorage.getItem("userId");
      const updateData = {
        name: formData.name,
        email: formData.email,
        location: formData.location
      };

      const response = await API.put(`/api/users/${userId}`, updateData);
      
      // Update localStorage
      localStorage.setItem("user", JSON.stringify(response.data.user));
      localStorage.setItem("userName", response.data.user.name);

      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error.response?.data?.error || "Failed to update profile" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords don't match" });
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" });
      setLoading(false);
      return;
    }

    try {
      const userId = localStorage.getItem("userId");
      await API.put(`/api/users/${userId}/password`, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      setMessage({ type: "success", text: "Password updated successfully!" });
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));
    } catch (error) {
      setMessage({ 
        type: "error", 
        text: error.response?.data?.error || "Failed to update password" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page">
      {userRole.toLowerCase() === 'moderator' ? <ModeratorSidebar /> : <CitizenSidebar />}
      <div className="settings-content">
        <div className="settings-container">
          <h1 className="settings-title">Account Settings</h1>
          
          {message.text && (
            <div className={`settings-message ${message.type}`}>
              {message.text}
            </div>
          )}

          {/* Profile Information Section */}
          <div className="settings-section">
            <h2 className="section-title">Profile Information</h2>
            <form onSubmit={handleUpdateProfile} className="settings-form">
              <div className="form-group">
                <label htmlFor="name">
                  <FiUser /> Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">
                  <FiMail /> Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="location">
                  <FiMapPin /> Location/District
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., South West Delhi"
                  required={userRole.toLowerCase() === 'citizen'}
                  disabled={userRole.toLowerCase() === 'moderator'}
                />
              </div>

              <button type="submit" className="settings-save-btn" disabled={loading}>
                <FiSave /> {loading ? "Saving..." : "Save Profile"}
              </button>
            </form>
          </div>

          {/* Password Change Section */}
          <div className="settings-section">
            <h2 className="section-title">Change Password</h2>
            <form onSubmit={handleUpdatePassword} className="settings-form">
              <div className="form-group">
                <label htmlFor="currentPassword">
                  <FiLock /> Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">
                  <FiLock /> New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">
                  <FiLock /> Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              <button type="submit" className="settings-save-btn" disabled={loading}>
                <FiSave /> {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
