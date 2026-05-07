import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiHome, FiClipboard, FiUser, FiLogOut, FiGrid, FiSettings, FiBarChart2, FiChevronRight, FiChevronUp, FiMap } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import "./CitizenSidebar.css";

function ModeratorSidebar({ isCollapsed, setIsCollapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);

  const generalItems = [
    { path: "/moderator-dashboard", label: "Dashboard", icon: FiHome },
    { path: "/moderator-complaints", label: "Complaints", icon: FiClipboard },
    { path: "/analytics", label: "Analytics", icon: FiBarChart2 },
    { path: "/moderator-heatmap", label: "Spatial Map", icon: FiMap },
  ];

  const handleLogout = () => {
    localStorage.clear();
    window.dispatchEvent(new Event('authChanged'));
    navigate("/login");
  };

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userName = user.name || user.username || "Moderator";
  const userRole = user.role || "Moderator";

  return (
    <aside className={`citizen-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="logo-container">
          <motion.div 
            className="logo-icon"
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.5 }}
          >
            <FiGrid />
          </motion.div>
          {!isCollapsed && (
            <div className="logo-text">
              <div className="logo-title">SAMAAJ<span style={{ color: '#FF7A45' }}>.</span></div>
              <div className="logo-subtitle">Moderator Portal</div>
            </div>
          )}
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {!isCollapsed && <div className="sidebar-section-title">General</div>}
        {generalItems.map((item) => (
          <motion.button
            key={item.path}
            initial={false}
            animate={{ opacity: 1, x: 0 }}
            className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
            onClick={() => navigate(item.path)}
            title={isCollapsed ? item.label : ""}
          >
            <span className="nav-icon"><item.icon /></span>
            {!isCollapsed && <span className="nav-label">{item.label}</span>}
            {!isCollapsed && location.pathname === item.path && <FiChevronRight style={{ marginLeft: 'auto' }} />}
          </motion.button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="position-relative">
          <AnimatePresence>
            {showDropdown && !isCollapsed && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="user-dropdown-menu shadow-lg border border-light"
              >
                <button className="dropdown-item" onClick={() => { navigate("/moderator-profile"); setShowDropdown(false); }}>
                  <FiUser size={14} /> Account
                </button>
                <button className="dropdown-item" onClick={() => { navigate("/settings"); setShowDropdown(false); }}>
                  <FiSettings size={14} /> Settings
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item text-danger" onClick={handleLogout}>
                  <FiLogOut size={14} /> Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div 
            className={`user-snippet mb-3 ${showDropdown ? 'dropdown-active' : ''}`} 
            onClick={() => !isCollapsed && setShowDropdown(!showDropdown)}
          >
            <div className="user-avatar" style={{ background: '#FF7A45', color: '#fff' }}>
              {userName.charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <>
                <div className="user-info">
                  <div className="user-name">{userName}</div>
                  <div className="user-role">{userRole}</div>
                </div>
                <FiChevronUp className={`ms-auto transition-all ${showDropdown ? '' : 'rotate-180'}`} />
              </>
            )}
          </div>
        </div>
        
        {isCollapsed && (
          <button className="nav-item text-danger mt-2" onClick={handleLogout} title="Sign Out">
            <span className="nav-icon"><FiLogOut /></span>
          </button>
        )}
      </div>

      <style>{`
        .user-dropdown-menu {
          position: absolute;
          bottom: 100%;
          left: 0;
          width: 100%;
          background: #fff;
          border-radius: 20px;
          padding: 8px;
          margin-bottom: 12px;
          z-index: 100;
        }
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 16px;
          border: none;
          background: transparent;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.85rem;
          color: #444;
          transition: all 0.2s;
          text-align: left;
        }
        .dropdown-item:hover {
          background: #f3f4f6;
          color: #000;
        }
        .dropdown-divider {
          height: 1px;
          background: rgba(0,0,0,0.05);
          margin: 4px 8px;
        }
        .user-snippet {
          cursor: pointer;
          transition: all 0.3s;
        }
        .user-snippet:hover {
          border-color: rgba(0,0,0,0.1);
          background: #f3f4f6;
        }
        .dropdown-active {
          background: #000 !important;
          color: #fff !important;
        }
        .dropdown-active .user-name { color: #fff !important; }
        .rotate-180 { transform: rotate(180deg); }
        .transition-all { transition: all 0.3s ease; }
      `}</style>
    </aside>
  );
}

export default ModeratorSidebar;
