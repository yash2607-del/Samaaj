import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { FiFilter, FiActivity, FiPieChart, FiBarChart2, FiTrendingUp, FiMap, FiLayers } from 'react-icons/fi';
import API from '../../api';
import ModeratorSidebar from '../../components/ModeratorSidebar';
import HeatmapMap from '../../components/HeatmapMap';

const COLORS = ['#FF8042', '#00C49F', '#FFBB28', '#0088FE', '#8884d8'];

const AnalyticsDashboard = () => {
  const [stats, setStats] = useState({
    totalIssues: 0,
    statusDistribution: [],
    categoryDistribution: [],
    trends: []
  });
  
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    startDate: '',
    endDate: ''
  });

  const [heatmapData, setHeatmapData] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showMarkers, setShowMarkers] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [filters]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const [resStats, resHeatmap] = await Promise.all([
        API.get(`/api/analytics/stats?${params.toString()}`),
        API.get(`/api/analytics/heatmap?${params.toString()}`)
      ]);
      setStats(resStats.data);
      setHeatmapData(resHeatmap.data);
    } catch (error) {
      console.error('Failed to fetch analytics stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div className="d-flex" style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <ModeratorSidebar />
      <div className="flex-grow-1 p-4" style={{ overflowY: "auto" }}>
        
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1" style={{ color: "#1a1a1a" }}>Analytics Dashboard</h2>
            <p className="text-muted mb-0">Overview of civic issue reports and trends</p>
          </div>
          <div className="badge bg-primary px-3 py-2 fs-6 rounded-pill">
            <FiActivity className="me-2" /> Total: {stats.totalIssues}
          </div>
        </div>

        {/* Filters Panel */}
        <div className="card border-0 shadow-sm rounded-4 mb-4" style={{ backgroundColor: "white" }}>
          <div className="card-body d-flex gap-3 align-items-end flex-wrap">
            <div className="d-flex align-items-center me-3">
              <FiFilter className="text-muted me-2" size={20} />
              <span className="fw-bold text-muted">Filters</span>
            </div>
            <div className="flex-grow-1" style={{ minWidth: "150px" }}>
              <label className="form-label small text-muted mb-1">Category</label>
              <select className="form-select form-select-sm rounded-3" name="category" value={filters.category} onChange={handleFilterChange}>
                <option value="">All Categories</option>
                <option value="Sanitization">Sanitization</option>
                <option value="Cleanliness">Cleanliness</option>
                <option value="Electricity">Electricity</option>
                <option value="Road">Road</option>
                <option value="Water">Water</option>
                <option value="Public Safety">Public Safety</option>
              </select>
            </div>
            <div className="flex-grow-1" style={{ minWidth: "150px" }}>
              <label className="form-label small text-muted mb-1">Status</label>
              <select className="form-select form-select-sm rounded-3" name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div className="flex-grow-1" style={{ minWidth: "150px" }}>
              <label className="form-label small text-muted mb-1">Start Date</label>
              <input type="date" className="form-control form-control-sm rounded-3" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
            </div>
            <div className="flex-grow-1" style={{ minWidth: "150px" }}>
              <label className="form-label small text-muted mb-1">End Date</label>
              <input type="date" className="form-control form-control-sm rounded-3" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            
            {/* Spatial Heatmap Analysis */}
            <div className="col-12">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                  <h5 className="fw-bold mb-0 d-flex align-items-center">
                    <FiMap className="me-2 text-info" /> Spatial Analysis Heatmap
                  </h5>
                  <div className="d-flex gap-3 align-items-center bg-light p-2 rounded-pill px-4 shadow-sm border">
                    <div className="form-check form-switch mb-0 d-flex align-items-center me-2">
                      <input className="form-check-input mt-0 me-2" type="checkbox" role="switch" id="modHeatToggle" 
                        checked={showHeatmap} onChange={(e) => setShowHeatmap(e.target.checked)} />
                      <label className="form-check-label small fw-bold text-muted" htmlFor="modHeatToggle">Density</label>
                    </div>
                    <div className="border-start ps-3 form-check form-switch mb-0 d-flex align-items-center">
                      <input className="form-check-input mt-0 me-2" type="checkbox" role="switch" id="modMarkerToggle" 
                        checked={showMarkers} onChange={(e) => setShowMarkers(e.target.checked)} />
                      <label className="form-check-label small fw-bold text-muted" htmlFor="modMarkerToggle">Markers</label>
                    </div>
                  </div>
                </div>
                <div style={{ height: "450px", width: "100%", borderRadius: "16px", overflow: "hidden", border: "1px solid #eee" }}>
                  <HeatmapMap 
                    points={heatmapData} 
                    showHeatmap={showHeatmap} 
                    showMarkers={showMarkers} 
                  />
                </div>
              </div>
            </div>

            {/* Trends Chart */}
            <div className="col-12">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                <h5 className="fw-bold mb-4 d-flex align-items-center">
                  <FiTrendingUp className="me-2 text-primary" /> Reports Over Time
                </h5>
                <div style={{ height: "300px", width: "100%" }}>
                  <ResponsiveContainer>
                    <LineChart data={stats.trends} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="date" tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="issues" stroke="#FF8042" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Status Pie Chart */}
            <div className="col-lg-5">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                <h5 className="fw-bold mb-4 d-flex align-items-center">
                  <FiPieChart className="me-2 text-success" /> Status Distribution
                </h5>
                <div style={{ height: "280px", width: "100%" }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={stats.statusDistribution}
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats.statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Category Bar Chart */}
            <div className="col-lg-7">
              <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
                <h5 className="fw-bold mb-4 d-flex align-items-center">
                  <FiBarChart2 className="me-2 text-warning" /> Issues by Category
                </h5>
                <div style={{ height: "280px", width: "100%" }}>
                  <ResponsiveContainer>
                    <BarChart data={stats.categoryDistribution} margin={{ top: 5, right: 0, left: 0, bottom: 5 }} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
                      <XAxis type="number" tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#888' }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="value" fill="#00C49F" radius={[0, 4, 4, 0]} barSize={24}>
                        {stats.categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
