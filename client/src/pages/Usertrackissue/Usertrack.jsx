import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:3000"; // adjust if your server runs elsewhere

export default function Usertrack() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    axios
      .get(`${API_BASE}/api/complaints`)
      .then((res) => {
        if (!mounted) return;
        setIssues(res.data || []);
      })
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.error || "Failed to load complaints");
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const statusBadgeClass = (status) => {
    switch ((status || "").toLowerCase()) {
      case "pending":
        return "bg-warning text-dark";
      case "in progress":
        return "bg-info text-dark";
      case "resolved":
        return "bg-success text-white";
      case "rejected":
        return "bg-danger text-white";
      default:
        return "bg-secondary text-white";
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return iso;
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-warning" role="status" aria-hidden="true" />
        <div className="mt-2 text-muted">Loading your complaints...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  if (!issues.length) {
    return (
      <div className="container py-5">
        <div className="alert alert-info">No complaints found. Post your first complaint.</div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h3 className="mb-4">Your Reported Issues</h3>
      <div className="row g-4">
        {issues.map((i) => {
          const imgSrc = i.photo ? `${API_BASE}${i.photo}` : null;
          return (
            <div className="col-md-6 col-lg-4" key={i._id || i.id}>
              <div className="card h-100 shadow-sm">
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    className="card-img-top"
                    alt={i.title}
                    style={{ height: 180, objectFit: "cover" }}
                  />
                ) : (
                  <div
                    className="bg-light d-flex align-items-center justify-content-center"
                    style={{ height: 180 }}
                  >
                    <span className="text-muted">No image</span>
                  </div>
                )}

                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title mb-0" style={{ fontSize: 18 }}>{i.title}</h5>
                    <span className={`badge ${statusBadgeClass(i.status)} ms-2`}>{i.status}</span>
                  </div>

                  <p className="card-text text-muted small mb-2" style={{ flexGrow: 1 }}>
                    {i.description ? (i.description.length > 150 ? i.description.slice(0, 150) + "…" : i.description) : "No description provided."}
                  </p>

                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div>
                      <div className="small text-muted">{i.category}</div>
                      <div className="small text-secondary">{i.location}</div>
                    </div>
                    <div className="text-secondary small">{formatDate(i.createdAt)}</div>
                  </div>
                </div>

                <div className="card-footer bg-white border-0 pt-0 pb-3">
                  <div className="d-flex justify-content-end">
                    <button className="btn btn-sm btn-outline-warning me-2" onClick={() => alert('Open details')}>
                      View
                    </button>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => alert('Share or actions')}>
                      Actions
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}