import React, { useState } from "react";
import { filterByCategory, filterByStatus, searchComplaints } from "../../utils/filters";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import img4 from "../../assets/img4.jpg";

// Dummy data for complaints
const dummyComplaints = [
  {
    id: 1,
    title: "Street Light Not Working",
    description: "The street light near my house is not working.",
    category: "Electricity",
    status: "Open",
    date: "2025-09-20",
    photo: "",
  },
  {
    id: 2,
    title: "Garbage Collection Delay",
    description: "Garbage has not been collected for 3 days.",
    category: "Cleanliness",
    status: "Resolved",
    date: "2025-09-18",
    photo: "",
  },
  {
    id: 3,
    title: "Water Leakage",
    description: "Water is leaking from the main pipe.",
    category: "Water",
    status: "In Progress",
    date: "2025-09-19",
    photo: "",
  },
];

const categories = [
  "All",
  "Sanitization",
  "Cleanliness",
  "Electricity",
  "Road",
  "Water",
  "Public Safety",
];

const statuses = ["All", "Open", "In Progress", "Resolved"];

const Dashboard = () => {
  const [complaints] = useState(dummyComplaints);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  let filteredComplaints = filterByCategory(complaints, category);
  filteredComplaints = filterByStatus(filteredComplaints, status);
  filteredComplaints = searchComplaints(filteredComplaints, search);

  return (
    <>
      <Navbar />

      <section className="dashboard-hero-section position-relative py-5" style={{ background: "#fffbe6" }}>
        <div className="container text-center">
          <h1 className="display-5 fw-bold text-golden mb-4 mt-5">My Complaints Dashboard</h1>
          <h4 className="text-secondary mb-4">Track, Search, and Filter your civic issues</h4>
        </div>
      </section>

      <section className="dashboard-filters-section bg-white py-3">
        <div className="container">
          <div className="row justify-content-center mb-3">
            <div className="col-md-4 mb-2">
              <input
                type="text"
                className="form-control"
                placeholder="Search by title or description"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-md-3 mb-2">
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3 mb-2">
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {statuses.map((stat) => (
                  <option key={stat} value={stat}>
                    {stat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-list-section py-4 bg-light">
        <div className="container">
          <h2 className="mb-4 text-golden text-center">Your Complaints</h2>
          <div className="row">
            {filteredComplaints.length === 0 ? (
              <div className="col-12 text-center text-muted py-5">
                No complaints found.
              </div>
            ) : (
              filteredComplaints.map((complaint) => (
                <div className="col-md-6 col-lg-4 mb-4" key={complaint.id}>
                  <div className="card shadow-sm h-100">
                    <div className="card-body">
                      <h5 className="card-title">{complaint.title}</h5>
                      <p className="card-text">{complaint.description}</p>
                      <span className="badge bg-warning text-dark me-2">
                        {complaint.category}
                      </span>
                      <span
                        className={`badge ${
                          complaint.status === "Resolved"
                            ? "bg-success"
                            : complaint.status === "In Progress"
                            ? "bg-info text-dark"
                            : "bg-secondary"
                        }`}
                      >
                        {complaint.status}
                      </span>
                      <div className="mt-2 text-muted" style={{ fontSize: "0.9em" }}>
                        {complaint.date}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="dashboard-contact-section py-5 bg-white text-dark">
        <div className="container ">
          <div className="card bg-light rounded shadow p-4">
            <div className="row align-items-center">
              {/* Logo */}
              <div className="col-md-4 text-center mb-4 mb-md-0">
                <img
                  src={img4}
                  alt="Samaaj Logo"
                  className="img-fluid rounded shadow-sm"
                  style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                />
              </div>
              {/* Info & Text */}
              <div className="col-md-8">
                <div className="text-md-start text-center">
                  <h2 className="mb-3 text-dark fw-bold">Need Help?</h2>
                  <p className="mb-4 text-secondary fs-5">
                    For any queries or support, reach out to us and we’ll assist you with your complaints.
                  </p>
                  <form className="d-flex flex-column flex-sm-row gap-3">
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Enter your email"
                      required
                    />
                    <button type="submit" className="btn btn-warning fw-semibold px-4">
                      Contact
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default Dashboard;