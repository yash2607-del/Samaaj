import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { filterByCategory, filterByStatus, searchComplaints } from "../../utils/filters";
import CitizenSidebar from "../../components/CitizenSidebar";
import { 
  FiUser, FiClipboard, FiCheckCircle, FiClock, 
  FiSearch, FiFilter, FiList, FiAlertCircle, 
  FiCalendar, FiEye, FiPlusCircle, FiSettings,
  FiZap, FiTag, FiInbox 
} from 'react-icons/fi';

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
  const navigate = useNavigate();
  const [complaints] = useState(dummyComplaints);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  let filteredComplaints = filterByCategory(complaints, category);
  filteredComplaints = filterByStatus(filteredComplaints, status);
  filteredComplaints = searchComplaints(filteredComplaints, search);

  const userName = localStorage.getItem("userName") || "Citizen";
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="d-flex" style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <CitizenSidebar />
      <div className="flex-grow-1" style={{ overflow: "auto" }}>

      <section className="py-3 px-4 border-bottom shadow-sm" style={{ background: "linear-gradient(135deg, #FFC107 0%, #FFD54F 100%)" }}>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-1 fw-bold" style={{ color: "#1a1a1a" }}>{getGreeting()}, {userName}</h4>
            <p className="mb-0 small" style={{ color: "#424242" }}>Empowering citizens to build better communities together</p>
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="text-end d-none d-md-block">
              <div className="fw-semibold" style={{ fontSize: "0.9rem", color: "#1a1a1a" }}>{userName}</div>
              <div style={{ fontSize: "0.75rem", color: "#424242" }}>Citizen Account</div>
            </div>
            <button 
              className="btn rounded-circle p-0 d-flex align-items-center justify-content-center"
              style={{ width: "48px", height: "48px", backgroundColor: "white", border: "2px solid #1a1a1a" }}
              onClick={() => navigate('/user-profile')}
              title="View Profile"
            >
              <FiUser style={{ fontSize: "1.5rem", color: "#1a1a1a" }} />
            </button>
          </div>
        </div>
      </section>

      <section className="py-4 px-4" style={{ backgroundColor: "#FFFEF7" }}>
        <div className="row g-3">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100" style={{ borderTop: "4px solid #FFC107" }}>
              <div className="card-body d-flex align-items-center">
                <div className="rounded-circle d-flex align-items-center justify-content-center me-3"
                     style={{ width: "55px", height: "55px", backgroundColor: "#FFF9C4" }}>
                  <FiClipboard style={{ fontSize: "1.6rem", color: "#F57C00" }} />
                </div>
                <div>
                  <h3 className="mb-0 fw-bold" style={{ color: "#1a1a1a" }}>{complaints.length}</h3>
                  <p className="mb-0 small" style={{ color: "#616161" }}>Total Submissions</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100" style={{ borderTop: "4px solid #4CAF50" }}>
              <div className="card-body d-flex align-items-center">
                <div className="rounded-circle d-flex align-items-center justify-content-center me-3"
                     style={{ width: "55px", height: "55px", backgroundColor: "#E8F5E9" }}>
                  <FiCheckCircle style={{ fontSize: "1.6rem", color: "#2E7D32" }} />
                </div>
                <div>
                  <h3 className="mb-0 fw-bold" style={{ color: "#1a1a1a" }}>
                    {complaints.filter(c => c.status === "Resolved").length}
                  </h3>
                  <p className="mb-0 small" style={{ color: "#616161" }}>Successfully Resolved</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100" style={{ borderTop: "4px solid #FF9800" }}>
              <div className="card-body d-flex align-items-center">
                <div className="rounded-circle d-flex align-items-center justify-content-center me-3"
                     style={{ width: "55px", height: "55px", backgroundColor: "#FFF3E0" }}>
                  <FiClock style={{ fontSize: "1.6rem", color: "#E65100" }} />
                </div>
                <div>
                  <h3 className="mb-0 fw-bold" style={{ color: "#1a1a1a" }}>
                    {complaints.filter(c => c.status === "In Progress").length}
                  </h3>
                  <p className="mb-0 small" style={{ color: "#616161" }}>Currently Processing</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-4 px-4 bg-white border-bottom">
        <div className="mb-3">
          <h5 className="mb-3 fw-semibold d-flex align-items-center gap-2" style={{ color: "#1a1a1a" }}>
            <FiFilter style={{ color: "#FFC107" }} />
            Filter & Search Complaints
          </h5>
          <div className="row g-3">
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text" style={{ backgroundColor: "#FFF9C4", border: "1px solid #FFC107" }}>
                  <FiSearch style={{ color: "#F57C00" }} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by title or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
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
            <div className="col-md-3">
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

      <section className="py-4 px-4" style={{ backgroundColor: "#FFFEF7" }}>
        <div className="mb-4 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-semibold d-flex align-items-center gap-2" style={{ color: "#1a1a1a" }}>
            <FiList style={{ color: "#FFC107" }} />
            Your Civic Complaints ({filteredComplaints.length})
          </h5>
          <button className="btn btn-sm fw-semibold" 
                  style={{ backgroundColor: "#FFC107", color: "#1a1a1a", border: "none" }}
                  onClick={() => navigate('/complaint')}>
            <FiPlusCircle className="me-1" />
            Submit New Issue
          </button>
        </div>
        <div className="row g-4">
          {filteredComplaints.length === 0 ? (
            <div className="col-12">
              <div className="card border-0 shadow-sm text-center py-5">
                <div className="card-body">
                  <FiInbox style={{ fontSize: "3.5rem", color: "#E0E0E0" }} />
                  <h4 className="mt-3 mb-2" style={{ color: "#616161" }}>No Complaints Found</h4>
                  <p className="mb-3" style={{ color: "#757575" }}>Adjust your filters or submit a new civic issue to begin</p>
                  <button className="btn fw-semibold" 
                          style={{ backgroundColor: "#FFC107", color: "#1a1a1a", border: "none" }}
                          onClick={() => navigate('/complaint')}>
                    <FiPlusCircle className="me-2" />Submit New Complaint
                  </button>
                </div>
              </div>
            </div>
          ) : (
            filteredComplaints.map((complaint) => (
              <div className="col-md-6 col-lg-4" key={complaint.id}>
                <div className="card h-100 border-0 shadow-sm" 
                     style={{ 
                       borderRadius: "12px", 
                       transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                       overflow: "hidden",
                       borderTop: "3px solid #FFC107"
                     }}
                     onMouseEnter={(e) => {
                       e.currentTarget.style.transform = "translateY(-6px)";
                       e.currentTarget.style.boxShadow = "0 12px 28px rgba(255, 193, 7, 0.3)";
                     }}
                     onMouseLeave={(e) => {
                       e.currentTarget.style.transform = "translateY(0)";
                       e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.12)";
                     }}>
                  <div className="card-body p-4">
                    <div className="d-flex align-items-start gap-3 mb-3">
                      <div className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                           style={{ width: "48px", height: "48px", backgroundColor: "#FFF9C4" }}>
                        <FiAlertCircle style={{ fontSize: "1.5rem", color: "#F57C00" }} />
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="card-title mb-1 fw-bold" style={{ color: "#2c3e50" }}>
                          {complaint.title}
                        </h6>
                        <span
                          className={`badge d-inline-flex align-items-center gap-1 ${
                            complaint.status === "Resolved"
                              ? "bg-success"
                              : complaint.status === "In Progress"
                              ? "text-dark"
                              : "bg-secondary"
                          }`}
                          style={{ 
                            fontSize: "0.7rem",
                            backgroundColor: complaint.status === "In Progress" ? "#FFC107" : undefined
                          }}
                        >
                          {complaint.status === "Resolved" ? <FiCheckCircle /> :
                           complaint.status === "In Progress" ? <FiClock /> :
                           <FiClock />}
                          {complaint.status}
                        </span>
                      </div>
                    </div>
                    <p className="card-text text-muted mb-3" style={{ fontSize: "0.875rem", lineHeight: "1.5" }}>
                      {complaint.description}
                    </p>
                    <div className="border-top pt-3 mt-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="badge d-inline-flex align-items-center gap-1" 
                              style={{ fontSize: "0.75rem", backgroundColor: "#FFF9C4", color: "#1a1a1a", border: "1px solid #FFC107" }}>
                          <FiTag />
                          {complaint.category}
                        </span>
                        <small className="text-muted d-flex align-items-center gap-1" style={{ fontSize: "0.75rem" }}>
                          <FiCalendar />
                          {complaint.date}
                        </small>
                      </div>
                      <button className="btn btn-sm w-100 mt-2 fw-semibold" 
                              style={{ backgroundColor: "#FFC107", color: "#1a1a1a", border: "none" }}>
                        <FiEye className="me-1" />
                        View Full Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="py-4 px-4 bg-white mb-4">
        <h5 className="mb-3 fw-semibold d-flex align-items-center gap-2" style={{ color: "#1a1a1a" }}>
          <FiZap style={{ color: "#FFC107" }} />
          Quick Access Actions
        </h5>
        <div className="row g-3">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100" 
                 style={{ cursor: "pointer", transition: "all 0.3s", borderRadius: "12px", borderTop: "3px solid #FFC107" }}
                 onClick={() => navigate('/complaint')}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.boxShadow = "0 8px 20px rgba(255, 193, 7, 0.3)";
                   e.currentTarget.style.transform = "translateY(-4px)";
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.12)";
                   e.currentTarget.style.transform = "translateY(0)";
                 }}>
              <div className="card-body text-center p-4">
                <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                     style={{ width: "60px", height: "60px", backgroundColor: "#FFF9C4" }}>
                  <FiPlusCircle style={{ fontSize: "1.8rem", color: "#F57C00" }} />
                </div>
                <h6 className="fw-bold mb-2" style={{ color: "#1a1a1a" }}>Submit New Issue</h6>
                <p className="mb-0 small" style={{ color: "#616161" }}>Report civic problems instantly</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100" 
                 style={{ cursor: "pointer", transition: "all 0.3s", borderRadius: "12px", borderTop: "3px solid #4CAF50" }}
                 onClick={() => navigate('/track-issue')}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.boxShadow = "0 8px 20px rgba(76, 175, 80, 0.3)";
                   e.currentTarget.style.transform = "translateY(-4px)";
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.12)";
                   e.currentTarget.style.transform = "translateY(0)";
                 }}>
              <div className="card-body text-center p-4">
                <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                     style={{ width: "60px", height: "60px", backgroundColor: "#E8F5E9" }}>
                  <FiList style={{ fontSize: "1.8rem", color: "#2E7D32" }} />
                </div>
                <h6 className="fw-bold mb-2" style={{ color: "#1a1a1a" }}>Track Progress</h6>
                <p className="mb-0 small" style={{ color: "#616161" }}>Monitor resolution status</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100" 
                 style={{ cursor: "pointer", transition: "all 0.3s", borderRadius: "12px", borderTop: "3px solid #FF9800" }}
                 onClick={() => navigate('/user-profile')}
                 onMouseEnter={(e) => {
                   e.currentTarget.style.boxShadow = "0 8px 20px rgba(255, 152, 0, 0.3)";
                   e.currentTarget.style.transform = "translateY(-4px)";
                 }}
                 onMouseLeave={(e) => {
                   e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.12)";
                   e.currentTarget.style.transform = "translateY(0)";
                 }}>
              <div className="card-body text-center p-4">
                <div className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                     style={{ width: "60px", height: "60px", backgroundColor: "#FFF3E0" }}>
                  <FiSettings style={{ fontSize: "1.8rem", color: "#E65100" }} />
                </div>
                <h6 className="fw-bold mb-2" style={{ color: "#1a1a1a" }}>Account Settings</h6>
                <p className="mb-0 small" style={{ color: "#616161" }}>Manage profile information</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
};

export default Dashboard;
