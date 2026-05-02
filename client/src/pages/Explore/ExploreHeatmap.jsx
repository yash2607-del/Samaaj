import React, { useState, useEffect } from 'react';
import { FiMap, FiList, FiFilter, FiLayers } from 'react-icons/fi';
import API from '../../api';
import CitizenSidebar from '../../components/CitizenSidebar';
import HeatmapMap from '../../components/HeatmapMap';

const ExploreHeatmap = () => {
  const [points, setPoints] = useState([]);
  const [filteredPoints, setFilteredPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Toggles & Filters
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showMarkers, setShowMarkers] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = ["Sanitization", "Cleanliness", "Electricity", "Road", "Water", "Public Safety", "Other"];

  useEffect(() => {
    fetchHeatmapData();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      setFilteredPoints(points.filter(p => p.category === selectedCategory || !p.category)); // API might not return category, need to handle if we want real filtering. Our API doesn't return category in heatmap data right now. Wait, I should add category to the backend heatmap route if we want to filter on frontend, or re-fetch with category query. Let's re-fetch with query.
    } else {
      setFilteredPoints(points);
    }
  }, [points, selectedCategory]);

  const fetchHeatmapData = async () => {
    setLoading(true);
    try {
      const url = selectedCategory ? `/api/analytics/heatmap?category=${encodeURIComponent(selectedCategory)}` : '/api/analytics/heatmap';
      const res = await API.get(url);
      setPoints(res.data);
    } catch (error) {
      console.error('Failed to fetch heatmap data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when category changes
  useEffect(() => {
    fetchHeatmapData();
    // eslint-disable-next-line
  }, [selectedCategory]);


  return (
    <div className="d-flex" style={{ minHeight: "100vh", backgroundColor: "#f5f7fa" }}>
      <CitizenSidebar />
      <div className="flex-grow-1 p-4 d-flex flex-column" style={{ overflow: "hidden", height: "100vh" }}>
        
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-3">
          <div>
            <h2 className="fw-bold mb-1" style={{ color: "#1a1a1a" }}>Explore Issues</h2>
            <p className="text-muted mb-0">Discover civic issues in your city via Heatmap</p>
          </div>
          
          <div className="d-flex gap-3 align-items-center bg-white p-2 rounded-pill shadow-sm px-4 border">
            <div className="d-flex align-items-center me-3 border-end pe-3">
              <FiLayers className="text-muted me-2" />
              <div className="form-check form-switch mb-0">
                <input className="form-check-input" type="checkbox" role="switch" id="heatToggle" 
                  checked={showHeatmap} onChange={(e) => setShowHeatmap(e.target.checked)} />
                <label className="form-check-label small fw-bold" htmlFor="heatToggle">Heatmap</label>
              </div>
            </div>
            
            <div className="d-flex align-items-center">
              <div className="form-check form-switch mb-0">
                <input className="form-check-input" type="checkbox" role="switch" id="markerToggle" 
                  checked={showMarkers} onChange={(e) => setShowMarkers(e.target.checked)} />
                <label className="form-check-label small fw-bold" htmlFor="markerToggle">Markers</label>
              </div>
            </div>
          </div>
        </div>

        <div className="row flex-grow-1 overflow-hidden g-4">
          
          {/* Map Section */}
          <div className="col-lg-8 col-xl-9 h-100 pb-2">
            <div className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden position-relative">
              {loading && (
                <div className="position-absolute top-50 start-50 translate-middle z-3 bg-white p-3 rounded-circle shadow">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}
              <HeatmapMap 
                points={filteredPoints} 
                showHeatmap={showHeatmap} 
                showMarkers={showMarkers} 
              />
            </div>
          </div>

          {/* Sidebar Panel for Explore */}
          <div className="col-lg-4 col-xl-3 h-100 pb-2 d-flex flex-column">
            <div className="card border-0 shadow-sm rounded-4 flex-grow-1 overflow-hidden d-flex flex-column bg-white">
              <div className="p-4 border-bottom">
                <h5 className="fw-bold mb-3 d-flex align-items-center">
                  <FiFilter className="me-2 text-primary" /> Filter by Category
                </h5>
                <select 
                  className="form-select rounded-3 py-2" 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              
              <div className="p-4 flex-grow-1 overflow-auto" style={{ backgroundColor: "#f8f9fa" }}>
                <h6 className="fw-bold mb-3 d-flex align-items-center text-muted">
                  <FiList className="me-2" /> Recent Nearby ({filteredPoints.length})
                </h6>
                
                {filteredPoints.length === 0 && !loading && (
                  <div className="text-center text-muted py-4 small">
                    No issues found for this filter.
                  </div>
                )}

                <div className="d-flex flex-column gap-3">
                  {filteredPoints.slice(0, 10).map((p, idx) => (
                    <div key={p.id || idx} className="bg-white p-3 rounded-3 shadow-sm border-start border-4" style={{ borderColor: p.status === 'Resolved' ? '#4CAF50' : '#FF9800' }}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="badge" style={{ backgroundColor: p.status === 'Resolved' ? '#E8F5E9' : '#FFF3E0', color: p.status === 'Resolved' ? '#2E7D32' : '#E65100' }}>
                          {p.status}
                        </span>
                        <span className="text-muted small" style={{ fontSize: "0.75rem" }}>
                          Dist: {p.district || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default ExploreHeatmap;
