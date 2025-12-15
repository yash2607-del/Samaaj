import "bootstrap/dist/css/bootstrap.min.css";
import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/landing/Landing";
import Signup from "./pages/auth/signup/Signup";
import Login from "./pages/auth/login/Login";
import Create from "./pages/UserIssue/Create";
import Dashboard from "./pages/dashboard/Dashboard";
import NearbyComplaints from "./pages/NearbyComplaints/NearbyComplaints";
import Usertrack from "./pages/Usertrackissue/Usertrack";
import UserProfile from "./pages/UserProfile/UserProfile";
import ModeratorDashboard from "./pages/ModeratorDashboard/ModeratorDashboard"
import ModeratorProfile from "./pages/ModeratorProfile/ModeratorProfile"
import ModeratorComplaints from "./pages/ModeratorComplaints/ModeratorComplaints"
import NotFound from "./pages/NotFound/NotFound";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/complaint" element={<Create />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/nearby-complaints" element={<NearbyComplaints />} />
      <Route path="/track-issue" element={<Usertrack />}/>
      <Route path="/user-profile" element={<UserProfile />}/>
      <Route path="/profile" element={<Navigate to="/user-profile" replace />}/>
      <Route path="/moderator-dashboard" element={<ModeratorDashboard />} />
      <Route path="/moderator-profile" element={<ModeratorProfile />} />
      <Route path="/moderator-complaints" element={<ModeratorComplaints />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
