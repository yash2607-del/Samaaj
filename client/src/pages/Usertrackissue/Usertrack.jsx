import React, { useEffect, useState } from "react";
import axios from "axios";

function Usertrack() {
  const [issues, setIssues] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    // Assume user email is stored in localStorage after login
    const email = localStorage.getItem("userEmail");
    axios.get(`http://localhost:3000/api/issues?email=${email}`)
      .then(res => setIssues(res.data))
      .catch(() => setError("Failed to fetch your issues"));
  }, []);

  return (
    <div className="container py-5">
      <h2>Your Reported Issues</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Location</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {issues.map(issue => (
            <tr key={issue._id}>
              <td>{issue.title}</td>
              <td>{issue.category}</td>
              <td>{issue.location}</td>
              <td>{issue.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Usertrack;