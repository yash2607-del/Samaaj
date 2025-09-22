import React from "react";

const UserCard = ({ complaint }) => (
  <div className="card shadow-sm h-100" style={{ border: "2px solid #FFD700", borderRadius: "12px", backgroundColor: "#fffbe6" }}>
    <div className="card-body">
      <h5 className="card-title text-golden">{complaint.title}</h5>
      <p className="card-text">{complaint.description}</p>
      <span className="badge bg-warning text-dark me-2">{complaint.category}</span>
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
);

export default UserCard;