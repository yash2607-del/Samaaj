import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { FiActivity, FiPieChart, FiTrendingUp, FiTarget, FiBox, FiClock, FiGrid, FiFilter } from 'react-icons/fi';
import API from '../../api/api.js';
import { motion } from 'framer-motion';

const COLORS = ['#FF7A45', '#1a1a1a', '#64748b', '#94a3b8', '#cbd5e1'];

const AnalyticsDashboard = () => {
  const [stats, setStats] = useState({ totalIssues: 0, statusDistribution: [], categoryDistribution: [], trends: [] });
  const [filters, setFilters] = useState({ category: '', status: '', startDate: '', endDate: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [filters]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const res = await API.get(`/api/analytics/stats?${params.toString()}`);
      setStats(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <motion.div 
      initial="hidden" animate="visible" variants={containerVariants}
      className="flex-grow-1 px-lg-5 px-3 py-5" 
      style={{ background: '#F9FAFB', minHeight: '100vh' }}
    >
      
      {/* Premium Header */}
      <header className="mb-5 d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-pill fw-black" style={{ background: '#FF7A45', color: '#fff', fontSize: '0.65rem', letterSpacing: '1px' }}>
              DATA INTELLIGENCE
            </span>
            <span className="text-muted fw-bold small opacity-40">/ ANALYTICS ENGINE</span>
          </div>
          <h1 className="fw-black mb-1 text-dark" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', letterSpacing: '-3px', lineHeight: '1' }}>
            INSIGHTS<span style={{ color: '#FF7A45' }}>.</span>
          </h1>
          <p className="text-muted fw-medium mb-0">High-fidelity visualization of societal infrastructure data.</p>
        </div>
        
        <div className="d-flex align-items-center gap-4 bg-white p-3 rounded-4 shadow-sm border border-light">
           <div className="text-end pe-4 border-end border-light">
              <div className="small fw-black text-muted opacity-40 text-uppercase" style={{ fontSize: '0.6rem', letterSpacing: '1px' }}>Global Volume</div>
              <div className="fw-black" style={{ fontSize: '1.8rem', letterSpacing: '-1px' }}>{stats.totalIssues}</div>
           </div>
           <div className="text-end">
              <div className="small fw-black text-muted opacity-40 text-uppercase" style={{ fontSize: '0.6rem', letterSpacing: '1px' }}>Health Index</div>
              <div className="fw-black text-success" style={{ fontSize: '1.8rem', letterSpacing: '-1px' }}>94%</div>
           </div>
        </div>
      </header>

      {/* Modern Filter Strip */}
      <section className="mb-5">
        <motion.div variants={itemVariants} className="p-4 bg-white shadow-sm border border-light" style={{ borderRadius: '32px' }}>
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <div className="small fw-black text-muted text-uppercase mb-2 ps-2" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>Segment</div>
              <select className="form-select border-0 bg-light rounded-pill px-4 fw-bold shadow-none" style={{ height: '50px', fontSize: '0.85rem' }} name="category" value={filters.category} onChange={handleFilterChange}>
                <option value="">All Segments</option>
                {["Sanitization", "Cleanliness", "Electricity", "Road", "Water", "Public Safety"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <div className="small fw-black text-muted text-uppercase mb-2 ps-2" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>From Date</div>
              <input type="date" className="form-control border-0 bg-light rounded-pill px-4 fw-bold shadow-none" style={{ height: '50px', fontSize: '0.85rem' }} name="startDate" value={filters.startDate} onChange={handleFilterChange} />
            </div>
            <div className="col-md-3">
              <div className="small fw-black text-muted text-uppercase mb-2 ps-2" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>To Date</div>
              <input type="date" className="form-control border-0 bg-light rounded-pill px-4 fw-bold shadow-none" style={{ height: '50px', fontSize: '0.85rem' }} name="endDate" value={filters.endDate} onChange={handleFilterChange} />
            </div>
            <div className="col-md-3">
               <button className="btn btn-dark w-100 rounded-pill fw-black" style={{ height: '50px', letterSpacing: '1px', fontSize: '0.8rem' }} onClick={fetchStats}>RECALCULATE</button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Primary Analytics Grid */}
      {loading ? (
        <div className="py-5 text-center"><div className="spinner-border text-dark opacity-20" style={{ width: '3rem', height: '3rem' }}></div></div>
      ) : (
        <>
          {/* Key Metrics Cards */}
          <div className="row g-4 mb-5">
            {[
              { label: 'Growth Rate', value: '+12.4%', icon: FiTrendingUp, color: '#FF7A45' },
              { label: 'Avg Resolution', value: '4.2 Days', icon: FiClock, color: '#1a1a1a' },
              { label: 'Coverage', value: '88%', icon: FiTarget, color: '#1a1a1a' },
              { label: 'Active Zones', value: '24', icon: FiBox, color: '#1a1a1a' }
            ].map((stat, i) => (
              <div key={i} className="col-lg-3 col-md-6">
                <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="p-4 bg-white border border-light shadow-sm" style={{ borderRadius: '28px' }}>
                   <div className="d-flex justify-content-between align-items-start mb-4">
                      <div className="p-3 rounded-4" style={{ background: '#F9FAFB' }}>
                        <stat.icon size={22} style={{ color: stat.color }} />
                      </div>
                      <div className="small fw-black opacity-10" style={{ fontSize: '0.6rem' }}>DATA_P{i+1}</div>
                   </div>
                   <div className="fw-black mb-1" style={{ fontSize: '2rem', letterSpacing: '-1px' }}>{stat.value}</div>
                   <div className="small fw-black text-muted text-uppercase opacity-50" style={{ fontSize: '0.6rem', letterSpacing: '1.5px' }}>{stat.label}</div>
                </motion.div>
              </div>
            ))}
          </div>

          <div className="row g-4">
            {/* High-Fidelity Area Chart */}
            <div className="col-lg-8">
              <motion.div variants={itemVariants} className="bg-white p-4 p-lg-5 shadow-sm border border-light h-100" style={{ borderRadius: '40px' }}>
                <div className="d-flex justify-content-between align-items-center mb-5">
                  <h5 className="fw-black mb-0 d-flex align-items-center gap-2">
                    <FiActivity className="text-primary" /> TEMPORAL FREQUENCY
                  </h5>
                  <div className="small fw-bold text-muted opacity-40">LAST 30 DAYS</div>
                </div>
                <div style={{ height: "350px", width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart data={stats.trends}>
                      <defs>
                        <linearGradient id="colorIssues" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF7A45" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#FF7A45" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                      <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', padding: '15px' }} />
                      <Area type="monotone" dataKey="issues" stroke="#FF7A45" strokeWidth={4} fillOpacity={1} fill="url(#colorIssues)" dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* Premium Pie Chart */}
            <div className="col-lg-4">
              <motion.div variants={itemVariants} className="bg-white p-4 p-lg-5 shadow-sm border border-light h-100" style={{ borderRadius: '40px' }}>
                <h5 className="fw-black mb-5 d-flex align-items-center gap-2">
                  <FiPieChart className="text-dark" /> DISTRIBUTION
                </h5>
                <div style={{ height: "350px", width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <PieChart>
                      <Pie 
                        data={stats.statusDistribution} 
                        innerRadius={80} 
                        outerRadius={120} 
                        paddingAngle={10} 
                        dataKey="value"
                        stroke="none"
                      >
                        {stats.statusDistribution.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}

      <style>{`
        .fw-black { font-weight: 900; }
        .shadow-sm { box-shadow: 0 4px 20px rgba(0,0,0,0.02) !important; }
      `}</style>
    </motion.div>
  );
};

export default AnalyticsDashboard;
