// Filter complaints by category
export function filterByCategory(complaints, category) {
  if (!category || category === "All") return complaints;
  return complaints.filter((item) => item.category === category);
}

// Filter complaints by status
export function filterByStatus(complaints, status) {
  if (!status || status === "All") return complaints;
  return complaints.filter((item) => item.status === status);
}

// Search complaints by title or description
export function searchComplaints(complaints, query) {
  if (!query) return complaints;
  const lowerQuery = query.toLowerCase();
  return complaints.filter((item) => {
    const title = String(item.title || "").toLowerCase();
    const description = String(item.description || "").toLowerCase();
    const category = String(item.category || "").toLowerCase();
    const departmentName = String(item.department?.name || item.department || "").toLowerCase();

    return (
      title.includes(lowerQuery) ||
      description.includes(lowerQuery) ||
      category.includes(lowerQuery) ||
      departmentName.includes(lowerQuery)
    );
  });
}