import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiHome, FiClipboard, FiUser, FiLogOut, FiGrid, FiSettings, FiHelpCircle, FiBarChart2 } from 'react-icons/fi';
import "./CitizenSidebar.css";

function ModeratorSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const generalItems = [
    { path: "/moderator-dashboard", label: "Dashboard", icon: FiHome },
    { path: "/moderator-complaints", label: "Complaints", icon: FiClipboard },
  ];

  const supportItems = [
    { path: "/moderator-profile", label: "My Profile", icon: FiUser },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const userName = localStorage.getItem("userName") || "Moderator";
  const userEmail = JSON.parse(localStorage.getItem("user") || "{}")?.email || "";

  return (
    <aside className="citizen-sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon"><FiGrid /></div>
          <div>
            <div className="logo-title">Samaaj</div>
            <div className="logo-subtitle">Moderator Portal</div>
          </div>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <div className="sidebar-section-title">GENERAL</div>
        {generalItems.map((item) => (
          <button
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon"><item.icon /></span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}

        <div className="sidebar-section-title">SUPPORT</div>
        {supportItems.map((item) => (
          <button
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon"><item.icon /></span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile-section">
          <div className="user-avatar">{userName.charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <div className="user-name">{userName}</div>
            <div className="user-email">{userEmail}</div>
          </div>
        </div>
        <button className="sidebar-settings">
          <span className="nav-icon"><FiSettings /></span>
          <span>Settings</span>
        </button>
        <button className="logout-btn" onClick={handleLogout}>
          <span className="nav-icon"><FiLogOut /></span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default ModeratorSidebar;
