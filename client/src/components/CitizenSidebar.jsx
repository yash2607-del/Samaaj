import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiHome, FiPlusCircle, FiSearch, FiUser, FiLogOut, FiGrid } from 'react-icons/fi';
import "./CitizenSidebar.css";

function CitizenSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { path: "/dashboard", label: "Dashboard", icon: FiHome },
    { path: "/complaint", label: "Submit Issue", icon: FiPlusCircle },
    { path: "/track-issue", label: "Track Progress", icon: FiSearch },
    { path: "/user-profile", label: "My Profile", icon: FiUser },
  ];

  const handleLogout = () => {
    localStorage.removeItem("userType");
    localStorage.removeItem("userId");
    navigate("/login");
  };

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
        {items.map((item) => (
          <button
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon"><item.icon /></span>
            <span className="nav-label">{item.label}</span>
            {location.pathname === item.path && <span className="active-indicator"></span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <span className="nav-icon"><FiLogOut /></span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default CitizenSidebar;
