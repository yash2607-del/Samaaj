import React from "react";
import { Dropdown, Carousel } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import img1 from "../../assets/img1.jpg";
import img2 from "../../assets/img2.jpg";
import img3 from "../../assets/img3.jpg";

const UserProfile = () => {
  return (
    <div className="bg-light min-vh-100 d-flex flex-column">
      <nav className="navbar navbar-expand-lg navbar-light bg-warning px-4 shadow-sm">
        <a className="navbar-brand fw-bold fs-3 text-dark" href="/">
          Samaaj
        </a>

        <div className="ms-auto d-flex align-items-center">
          <Dropdown align="end">
            <Dropdown.Toggle
              variant="light"
              id="dropdown-user"
              className="border-0 bg-transparent d-flex align-items-center"
            >
              <div
                className="rounded-circle bg-dark text-white d-flex justify-content-center align-items-center"
                style={{ width: "40px", height: "40px", fontWeight: "600" }}
              >
                U
              </div>
            </Dropdown.Toggle>

            <Dropdown.Menu className="shadow border-0 rounded-3">
              <Dropdown.Item href="#home">🏠 Home</Dropdown.Item>
              <Dropdown.Item href="#notifications">🔔 Notifications</Dropdown.Item>
              <Dropdown.Item href="#complaints">📋 Complaints</Dropdown.Item>
              <Dropdown.Item href="#profile">👤 Profile</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </nav>

      <div className="w-100">
        <Carousel fade indicators controls interval={3500}>
          <Carousel.Item>
            <img
              className="d-block w-100"
              src={img1}
              alt="First slide"
              style={{
                height: "400px",
                objectFit: "cover",
                margin: 0,
                padding: 0,
              }}
            />
          </Carousel.Item>
          <Carousel.Item>
            <img
              className="d-block w-100"
              src={img2}
              alt="Second slide"
              style={{
                height: "400px",
                objectFit: "cover",
                margin: 0,
                padding: 0,
              }}
            />
          </Carousel.Item>
          <Carousel.Item>
            <img
              className="d-block w-100"
              src={img3}
              alt="Third slide"
              style={{
                height: "400px",
                objectFit: "cover",
                margin: 0,
                padding: 0,
              }}
            />
          </Carousel.Item>
        </Carousel>
      </div>

      {/* ===== Greeting Section ===== */}
      <div className="container mt-5">
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
          <h4 className="fw-semibold text-dark">
            Good Evening, Active Citizen 👋
          </h4>
          <p className="text-muted mb-0">
            Here are today's actions for you
          </p>
        </div>

        {/* ===== Complaint Card (slimmer width) ===== */}
        <div className="d-flex justify-content-center">
          <div
            className="card border-0 shadow-sm rounded-4 p-4 bg-warning-subtle mt-4"
            style={{
              maxWidth: "550px",
              width: "100%",
              background:
                "linear-gradient(135deg, #fff7e6 0%, #ffecb3 100%)",
            }}
          >
            <h5 className="fw-bold text-dark mb-2">Garbage Dump Reported</h5>
            <p className="mb-1 text-secondary">
              <strong>ID:</strong> W09322110C32893469
            </p>
            <p className="mb-3 text-secondary">
              📍 A67, Block Rz, Madhu Vihar, New Delhi, 110059, India
            </p>
            <button className="btn btn-dark rounded-3 px-4">
              View Status
            </button>
          </div>
        </div>

        {/* ===== Action Cards ===== */}
        <div className="row text-center mt-5 g-4">
          <div className="col-md-4">
            <div className="card shadow-sm border-0 rounded-4 p-4 bg-primary-subtle h-100">
              <h6 className="fw-bold mb-2 text-primary">Post a Complaint</h6>
              <p className="text-muted small mb-0">
                We are committed to receiving your complaint.
              </p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm border-0 rounded-4 p-4 bg-success-subtle h-100">
              <h6 className="fw-bold mb-2 text-success">Rate Public Toilet</h6>
              <p className="text-muted small mb-0">Scan QR Code.</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm border-0 rounded-4 p-4 bg-info-subtle h-100">
              <h6 className="fw-bold mb-2 text-info">Share Local Issue</h6>
              <p className="text-muted small mb-0">
                Report area problems easily.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Footer ===== */}
      <footer className="text-center py-3 mt-5 text-muted small bg-white shadow-sm">
        © 2025 Samaaj | Empowering Citizens for a Cleaner Tomorrow
      </footer>
    </div>
  );
};

export default UserProfile;
