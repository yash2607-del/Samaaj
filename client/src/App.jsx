import "bootstrap/dist/css/bootstrap.min.css";
import { Routes, Route } from "react-router-dom";
import Landing from "./pages/landing/Landing";
import Signup from "./pages/auth/signup/Signup";
import Login from "./pages/auth/login/Login";
import Create from "./pages/UserIssue/Create";
import Dashboard from "./pages/dashboard/Dashboard";
import Usertrack from "./pages/Usertrackissue/Usertrack";
import UserProfile from "./pages/UserProfile/UserProfile";
import Profile from "./Profile/Profile";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/complaint" element={<Create />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/track-issue" element={<Usertrack />}/>
      <Route path="/user-profile" element={<UserProfile />}/>
      <Route path="/profile" element={<Profile/>}/>

      




    </Routes>
  );
}

export default App;
