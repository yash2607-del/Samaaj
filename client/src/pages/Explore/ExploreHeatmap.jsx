import React, { useState, useEffect } from 'react';
import { FiMap, FiList, FiFilter, FiLayers, FiActivity, FiMapPin } from 'react-icons/fi';
import API from '../../api/api.js';
import HeatmapMap from '../../components/HeatmapMap';
import { motion } from 'framer-motion';

const ExploreHeatmap = () => {
  const [points, setPoints] = useState([]);
  const [filteredPoints, setFilteredPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showMarkers, setShowMarkers] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = ["Sanitization", "Cleanliness", "Electricity", "Road", "Water", "Public Safety"];

  const fetchHeatmapData = async () => {
    setLoading(true);
    try {
      const url = selectedCategory ? `/api/analytics/heatmap?category=${encodeURIComponent(selectedCategory)}` : '/api/analytics/heatmap';
      const res = await API.get(url);
      setPoints(res.data || []);
      setFilteredPoints(res.data || []);
    } catch (error) {
      console.error('Failed to fetch heatmap data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeatmapData();
  }, [selectedCategory]);

  return (
    <div className="flex-grow-1 p-0 d-flex flex-column" style={{ height: 'calc(100vh - 10px)', background: '#F9FAFB' }}>
      
      {/* Premium Analytics Header */}
      <header className="px-lg-5 px-3 py-4 bg-white border-bottom shadow-sm" style={{ zIndex: 10 }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
               <span className="px-2 py-0 rounded bg-dark text-white fw-black" style={{ fontSize: '0.6rem', letterSpacing: '1px' }}>EXPLORE</span>
               <span className="text-muted small fw-bold">GLOBAL INSIGHTS</span>
            </div>
            <h1 className="fw-black mb-0 text-dark" style={{ fontSize: '1.8rem', letterSpacing: '-1px' }}>HEATMAP ANALYTICS<span style={{ color: '#FF7A45' }}>.</span></h1>
          </div>

          <div className="d-flex align-items-center gap-3">
             <div className="d-flex align-items-center bg-light px-3 py-2 rounded-pill gap-3 border border-light">
                <div className="form-check form-switch mb-0 d-flex align-items-center gap-2">
                   <input className="form-check-input mt-0 cursor-pointer" type="checkbox" checked={showHeatmap} onChange={e => setShowHeatmap(e.target.checked)} />
                   <label className="small fw-black text-muted text-uppercase mb-0" style={{ fontSize: '0.65rem' }}>Heatmap</label>
                </div>
                <div className="vr opacity-10" style={{ height: '16px' }}></div>
                <div className="form-check form-switch mb-0 d-flex align-items-center gap-2">
                   <input className="form-check-input mt-0 cursor-pointer" type="checkbox" checked={showMarkers} onChange={e => setShowMarkers(e.target.checked)} />
                   <label className="small fw-black text-muted text-uppercase mb-0" style={{ fontSize: '0.65rem' }}>Markers</label>
                </div>
             </div>
             
             <select 
               className="form-select form-select-sm border-0 bg-light px-4 rounded-pill fw-bold text-muted shadow-none" 
               style={{ width: '180px', fontSize: '0.8rem', height: '40px' }}
               value={selectedCategory} 
               onChange={e => setSelectedCategory(e.target.value)}
             >
               <option value="">All Categories</option>
               {categories.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
          </div>
        </div>
      </header>

      {/* Main Split View */}
      <div className="flex-grow-1 row g-0 overflow-hidden">
        
        {/* Map View */}
        <div className="col-lg-8 col-xl-9 position-relative h-100">
           {loading && (
             <div className="position-absolute top-50 start-50 translate-middle z-3">
                <div className="spinner-border text-dark"></div>
             </div>
           )}
           <HeatmapMap points={filteredPoints} showHeatmap={showHeatmap} showMarkers={showMarkers} />
        </div>

        {/* Sidebar Data Panel */}
        <div className="col-lg-4 col-xl-3 h-100 bg-white border-start d-flex flex-column shadow-lg">
           <div className="p-4 border-bottom">
              <h6 className="fw-black mb-1 text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>Incident Distribution</h6>
              <p className="text-muted small mb-0">Analyzed from {points.length} reported datapoints.</p>
           </div>
           
           <div className="flex-grow-1 overflow-auto p-4 bg-light">
              <div className="d-flex flex-column gap-3">
                 {filteredPoints.length === 0 ? (
                   <div className="text-center py-5 opacity-40">
                      <FiActivity size={32} className="mb-2" />
                      <div className="small fw-bold">NO LOCAL DATA</div>
                   </div>
                 ) : (
                   filteredPoints.slice(0, 15).map((p, i) => (
                     <motion.div 
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                        key={p.id || i} 
                        className="p-3 bg-white border border-light shadow-sm" style={{ borderRadius: '18px' }}
                     >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                           <div className="d-flex flex-column gap-1">
                              <span className="px-2 py-1 rounded fw-black text-uppercase" style={{ fontSize: '0.6rem', background: p.status === 'Resolved' ? 'rgba(52,199,89,0.1)' : 'rgba(255,122,69,0.1)', color: p.status === 'Resolved' ? '#34C759' : '#FF7A45' }}>
                                 {p.status || 'PENDING'}
                              </span>
                              {p.mlReviewStatus && (
                                 <span className="px-2 py-0.5 rounded text-white fw-black" style={{ fontSize: '0.5rem', background: p.mlReviewStatus === 'AI Verified' ? '#34C759' : '#FF7A45', letterSpacing: '0.2px' }}>
                                    {p.mlReviewStatus.toUpperCase()}
                                 </span>
                              )}
                           </div>
                           <span className="text-muted fw-bold small" style={{ fontSize: '0.65rem' }}>{p.category?.toUpperCase() || 'GENERAL'}</span>
                        </div>
                        <div className="d-flex align-items-center gap-2 text-dark small fw-bold">
                           <FiMapPin size={12} className="text-danger" />
                           <span className="text-truncate">{p.district || 'Localized Issue'}</span>
                        </div>
                     </motion.div>
                   ))
                 )}
              </div>
           </div>

           <div className="p-4 border-top bg-white">
              <div className="d-flex justify-content-between align-items-center">
                 <div className="small fw-bold text-muted">Density Score</div>
                 <div className="fw-black text-dark">{points.length > 50 ? 'HIGH' : 'STABLE'}</div>
              </div>
              <div className="progress mt-2" style={{ height: '4px' }}>
                 <div className="progress-bar bg-dark" style={{ width: `${Math.min(points.length, 100)}%` }}></div>
              </div>
           </div>
        </div>
      </div>

      <style>{`
        .fw-black { font-weight: 900; }
        .cursor-pointer { cursor: pointer; }
      `}</style>
    </div>
  );
};

export default ExploreHeatmap;
