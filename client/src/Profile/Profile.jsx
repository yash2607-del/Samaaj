import React from "react";

const Profile = () => {
  // mock data just for UI preview
  const user = {
    name: "Zhenya Rynzhuk",
    email: "zhenyarynzhuk@gmail.com",
    number: "587-556-998-02",
    city: "Shanghai, China",
    state: "Mallen",
    zip: "7789",
    country: "China",
  };

  return (
  <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="profile-card bg-white p-4 rounded-4 shadow-sm text-center" style={{ maxWidth: "600px", width: "100%" }}>
        {/* Profile Image */}
        <div className="position-relative d-inline-block">
          <img
            src="https://via.placeholder.com/120"
            alt="Profile"
            className="rounded-circle border border-3 border-light shadow-sm"
            style={{ width: "120px", height: "120px", objectFit: "cover" }}
          />
          <span
            className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle p-2"
            style={{ fontSize: "0.8rem", cursor: "pointer" }}
          >
            <i className="bi bi-pencil"></i>
          </span>
        </div>

        {/* Profile Form */}
        <form className="mt-4 text-start">
          <div className="mb-3">
            <label className="form-label fw-semibold">Full Name</label>
            <input type="text" className="form-control" value="Zhenya Rynzhuk" readOnly />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Email</label>
            <div className="input-group">
              <input
                type="email"
                className="form-control"
                value="zhenyarynzhuk@gmail.com"
                readOnly
              />
              <span className="input-group-text bg-white border-0">
                <i className="bi bi-check-circle-fill text-success"></i>
              </span>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Number</label>
            <div className="input-group">
              <input type="text" className="form-control" value="587-556-998-02" readOnly />
              <span className="input-group-text bg-white border-0">
                <i className="bi bi-check-circle-fill text-success"></i>
              </span>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">City</label>
            <input type="text" className="form-control" value="Shanghai, China." readOnly />
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">State</label>
              <input type="text" className="form-control" value="Mallen" readOnly />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Zip Code</label>
              <input type="text" className="form-control" value="7789" readOnly />
            </div>
          </div>

          <div className="mb-2">
            <label className="form-label fw-semibold">Country</label>
            <div className="input-group">
              <span className="input-group-text">🇨🇳</span>
              <input type="text" className="form-control" value="China" readOnly />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
