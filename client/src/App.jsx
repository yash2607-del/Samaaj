import "bootstrap/dist/css/bootstrap.min.css";
import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import Lenis from 'lenis';
import Home from "./pages/landing/Home";
import About from "./pages/landing/About";
import Impact from "./pages/landing/Impact";
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
import ExploreHeatmap from "./pages/Explore/ExploreHeatmap";
import AnalyticsDashboard from "./pages/Analytics/AnalyticsDashboard";
import ModeratorHeatmap from "./pages/Analytics/ModeratorHeatmap";
import PortalLayout from "./components/layout/PortalLayout";

function App() {
  console.log("App Module Load: v5-Final-Fix");
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch (e) { return null; }
  });

  useEffect(() => {
    // Initialize Lenis for smooth scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    const handler = () => setUser(() => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } });
    window.addEventListener('authChanged', handler);
    window.addEventListener('storage', handler);
    
    return () => {
      lenis.destroy();
      window.removeEventListener('authChanged', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/impact" element={<Impact />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route element={<PortalLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/complaint" element={<Create />} />
        <Route path="/nearby-complaints" element={<NearbyComplaints />} />
        <Route path="/track-issue" element={<Usertrack />} />
        <Route path="/user-profile" element={<UserProfile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/moderator-dashboard" element={<ModeratorDashboard />} />
        <Route path="/moderator-profile" element={<ModeratorProfile />} />
        <Route path="/moderator-complaints" element={<ModeratorComplaints />} />
        <Route path="/explore" element={<ExploreHeatmap />} />
        <Route path="/analytics" element={<AnalyticsDashboard />} />
        <Route path="/moderator-heatmap" element={<ModeratorHeatmap />} />
      </Route>
      <Route path="/profile" element={<Navigate to="/user-profile" replace />} />
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
