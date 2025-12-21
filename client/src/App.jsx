import "bootstrap/dist/css/bootstrap.min.css";
import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import Landing from "./pages/landing/Landing";
import Home from "./pages/landing/Home";
import Signup from "./pages/auth/signup/Signup";
import Login from "./pages/auth/login/Login";
import Create from "./pages/UserIssue/Create";
import Dashboard from "./pages/dashboard/Dashboard";
import NearbyComplaints from "./pages/NearbyComplaints/NearbyComplaints";
import Usertrack from "./pages/Usertrackissue/Usertrack";
import UserProfile from "./pages/UserProfile/UserProfile";
import Settings from "./pages/Settings/Settings";
import ModeratorDashboard from "./pages/ModeratorDashboard/ModeratorDashboard"
import ModeratorProfile from "./pages/ModeratorProfile/ModeratorProfile"
import ModeratorComplaints from "./pages/ModeratorComplaints/ModeratorComplaints"
import NotFound from "./pages/NotFound/NotFound";
import Chatbot from "./components/Chatbot";
// Toast rendering is handled via dynamic import in the toast utility to
// avoid runtime failures when third-party toast components aren't ready.

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch (e) { return null; }
  });

  useEffect(() => {
    const handler = () => setUser(() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } });
    window.addEventListener('authChanged', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('authChanged', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  return (
    <Routes>
      <Route path="/" element={user ? <Home /> : <Landing />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/complaint" element={<Create />} />
      <Route path="/dashboard" element={user ? (user.role === 'Moderator' ? <Navigate to="/moderator-dashboard" replace /> : <Dashboard />) : <Navigate to="/login" replace />} />
      <Route path="/nearby-complaints" element={<NearbyComplaints />} />
      <Route path="/track-issue" element={<Usertrack />}/>
      <Route path="/user-profile" element={<UserProfile />}/>
      <Route path="/settings" element={<Settings />}/>
      <Route path="/profile" element={<Navigate to="/user-profile" replace />}/>
      <Route path="/moderator-dashboard" element={user ? (user.role === 'Moderator' ? <ModeratorDashboard /> : <Navigate to="/dashboard" replace />) : <Navigate to="/login" replace />} />
      <Route path="/moderator-profile" element={user ? (user.role === 'Moderator' ? <ModeratorProfile /> : <Navigate to="/user-profile" replace />) : <Navigate to="/login" replace />} />
      <Route path="/moderator-complaints" element={user ? (user.role === 'Moderator' ? <ModeratorComplaints /> : <Navigate to="/dashboard" replace />) : <Navigate to="/login" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function AppWithChatbotRoutes() {
  return (
    <>
      <App />
      <Chatbot />
    </>
  );
}
