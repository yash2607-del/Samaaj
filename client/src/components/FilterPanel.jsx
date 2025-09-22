import React from "react";

const FilterPanel = ({
  categories,
  statuses,
  selectedCategory,
  selectedStatus,
  onCategoryChange,
  onStatusChange,
}) => (
  <div className="d-flex flex-wrap gap-3 mb-3">
    <select
      className="form-select"
      style={{
        border: "2px solid #FFD700",
        borderRadius: "8px",
        backgroundColor: "#fffbe6",
        color: "#333",
        fontWeight: "500",
        maxWidth: "220px",
      }}
      value={selectedCategory}
      onChange={onCategoryChange}
      aria-label="Filter by Category"
    >
      {categories.map((cat) => (
        <option key={cat} value={cat}>
          {cat}
        </option>
      ))}
    </select>
    <select
      className="form-select"
      style={{
        border: "2px solid #FFD700",
        borderRadius: "8px",
        backgroundColor: "#fffbe6",
        color: "#333",
        fontWeight: "500",
        maxWidth: "220px",
      }}
      value={selectedStatus}
      onChange={onStatusChange}
      aria-label="Filter by Status"
    >
      {statuses.map((stat) => (
        <option key={stat} value={stat}>
          {stat}
        </option>
      ))}
    </select>
  </div>
);

export default FilterPanel;