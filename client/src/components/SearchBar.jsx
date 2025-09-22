import React from "react";

const SearchBar = ({ value, onChange, placeholder = "Search..." }) => (
  <input
    type="text"
    className="form-control"
    style={{
      border: "2px solid #FFD700",
      borderRadius: "8px",
      backgroundColor: "#fffbe6",
      color: "#333",
      fontWeight: "500",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    }}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    aria-label="Search"
  />
);

export default SearchBar;