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

  const accountItems = [
    { path: "/moderator-profile", label: "My Profile", icon: FiUser },
    { path: "/settings", label: "Settings", icon: FiSettings },
    { path: "/logout", label: "Sign Out", icon: FiLogOut },
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

        <div className="sidebar-section-title">ACCOUNT</div>
        {accountItems.map((item) => (
          <button
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
            onClick={() => item.path === "/logout" ? handleLogout() : navigate(item.path)}
          >
            <span className="nav-icon"><item.icon /></span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
      </div>
    </aside>
  );
}

export default ModeratorSidebar;
