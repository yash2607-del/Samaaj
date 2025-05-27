import "bootstrap/dist/css/bootstrap.min.css";
import { Routes, Route } from "react-router-dom";
import Landing from "./pages/landing/Landing";



function App() {
  return (
    <Routes>
     
      <Route path="/" element={<Landing />} />
     
     
    </Routes>
  );
}

export default App;