import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiHome, FiPlusCircle, FiSearch, FiUser, FiLogOut, FiGrid, FiSettings, FiHelpCircle } from 'react-icons/fi';
import "./CitizenSidebar.css";

function CitizenSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const generalItems = [
    { path: "/dashboard", label: "Dashboard", icon: FiHome },
    { path: "/nearby-complaints", label: "Nearby Issues", icon: FiSearch },
    { path: "/complaint", label: "Submit Issue", icon: FiPlusCircle },
    { path: "/track-issue", label: "Track Issues", icon: FiGrid },
  ];

  const accountItems = [
    { path: "/user-profile", label: "My Profile", icon: FiUser },
    { path: "/settings", label: "Settings", icon: FiSettings },
    { path: "/logout", label: "Sign Out", icon: FiLogOut },
  ];

  const handleLogout = () => {
    localStorage.removeItem("userType");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
    localStorage.removeItem("userName");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const userName = localStorage.getItem("userName") || "User";
  const userEmail = JSON.parse(localStorage.getItem("user") || "{}")?.email || "";

  return (
    <aside className="citizen-sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon"><FiGrid /></div>
          <div>
            <div className="logo-title">Samaaj</div>
            <div className="logo-subtitle">Citizen Portal</div>
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

export default CitizenSidebar;
