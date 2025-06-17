import "bootstrap/dist/css/bootstrap.min.css";
import { Routes, Route } from "react-router-dom";
import Landing from "./pages/landing/Landing";
import Signup from "./pages/auth/signup/Signup";
import Login from "./pages/auth/login/Login";


function App() {
  return (
    <Routes>
     
      <Route path="/" element={<Landing />} />
       <Route path="/signup" element={<Signup/>} />
      <Route path="/login" element={<Login/>} />
     
     
    </Routes>
  );
}

export default App;