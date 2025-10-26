import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import axios from "axios";

const ModeratorDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [updating, setUpdating] = useState(null);

  const fetchComplaints = (userEmail) => {
    setLoading(true);
    axios
      .get("http://localhost:3000/api/complaints/moderator-view", {
        params: { email: userEmail },
      })
      .then((res) => setComplaints(res.data))
      .catch((err) => console.error("Error fetching complaints", err))
      .finally(() => setLoading(false));
  };

  const updateStatus = async (complaintId, newStatus) => {
    try {
      setUpdating(complaintId);
      console.log('Updating status:', { complaintId, newStatus, userEmail: user.email });
      
      const response = await axios.patch(`http://localhost:3000/api/complaints/update-status/${complaintId}`, {
        status: newStatus,
        moderatorEmail: user.email
      });
      
      console.log('Update response:', response.data);
      // Refresh complaints after update
      fetchComplaints(user.email);
    } catch (error) {
      console.error("Error updating status:", error.response?.data || error.message);
      alert(error.response?.data?.message || "Failed to update status. Please try again.");
    } finally {
      setUpdating(null);
    }
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);

    if (!storedUser || storedUser.role !== "Moderator") return;

    setLoading(true);
    axios
      .get("http://localhost:3000/api/complaints/moderator-view", {
        params: { email: storedUser.email },
      })
      .then((res) => setComplaints(res.data))
      .catch((err) => console.error("Error fetching complaints", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />

      <section className="py-5 bg-white text-center">
        <div className="container">
          <h1 className="fw-bold mb-3 text-dark">Moderator Dashboard</h1>
          {user && (
            <p className="text-muted mb-4">
              Welcome, {user.name}! Viewing all complaints for your department:{" "}
              <strong>{user.department}</strong>
            </p>
          )}
        </div>
      </section>

      <section className="py-4 bg-light">
        <div className="container">
          {loading ? (
            <div className="text-center py-5">Loading complaints...</div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-5 text-muted">
              No complaints found for your department.
            </div>
          ) : (
            <div className="row">
              {complaints.map((c) => (
                <div className="col-md-6 col-lg-4 mb-4" key={c._id}>
                  <div className="card shadow-sm h-100 border-0">
                    <div className="card-body">
                      <h5 className="card-title">{c.title}</h5>
                      <p className="card-text">{c.description}</p>
                      <div className="mb-2">
                        <span className="badge bg-warning text-dark me-2">
                          {c.category}
                        </span>
                        <div className="mt-2">
                          <select
                            className={`form-select form-select-sm ${
                              updating === c._id ? "disabled" : ""
                            }`}
                            value={c.status}
                            onChange={(e) => updateStatus(c._id, e.target.value)}
                            disabled={updating === c._id}
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>
                      </div>
                      <small className="text-muted d-block mt-2">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
};

export default ModeratorDashboard;
