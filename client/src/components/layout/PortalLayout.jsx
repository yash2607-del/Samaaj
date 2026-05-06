import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import CitizenSidebar from '../CitizenSidebar';
import ModeratorSidebar from '../ModeratorSidebar';
import { FiMenu, FiX } from 'react-icons/fi';

const PortalLayout = () => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch (e) { return null; }
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handler = () => setUser(() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } });
    window.addEventListener('authChanged', handler);
    return () => window.removeEventListener('authChanged', handler);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isModerator = user.role === 'Moderator';
  const sidebarWidth = isCollapsed ? '80px' : '280px';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      {/* Mobile Toggle */}
      <div className="d-lg-none position-fixed top-0 start-0 p-3" style={{ zIndex: 1100 }}>
        <button 
          className="btn btn-dark shadow-lg rounded-circle d-flex align-items-center justify-content-center" 
          style={{ width: '45px', height: '45px' }}
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          {isMobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
      </div>

      <div className={`${isMobileOpen ? 'mobile-open' : ''}`} style={{ transition: 'all 0.3s' }}>
        {isModerator ? (
          <ModeratorSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} isMobileOpen={isMobileOpen} />
        ) : (
          <CitizenSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} isMobileOpen={isMobileOpen} />
        )}
      </div>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div 
          className="d-lg-none position-fixed top-0 start-0 w-100 h-100" 
          style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 999 }}
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <main style={{ 
        flexGrow: 1, 
        marginLeft: '0px', // Default for mobile
        paddingLeft: '0px',
        width: '100%',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      className="portal-main-content"
      >
        <div style={{ 
          marginLeft: '0px', 
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }} 
        className="portal-content-inner">
          <Outlet />
        </div>
      </main>

      <style>{`
        @media (min-width: 992px) {
          .portal-main-content {
            margin-left: ${sidebarWidth} !important;
            width: calc(100% - ${sidebarWidth}) !important;
          }
        }
        @media (max-width: 991px) {
          .citizen-sidebar {
            transform: translateX(-100%);
            width: 280px !important;
            position: fixed !important;
            z-index: 1050 !important;
          }
          .mobile-open .citizen-sidebar {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default PortalLayout;
