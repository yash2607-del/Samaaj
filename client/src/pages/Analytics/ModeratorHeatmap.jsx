import React, { useState, useEffect } from 'react';
import { FiMap, FiLayers, FiFilter, FiActivity, FiArrowLeft } from 'react-icons/fi';
import API from '../../api/api.js';
import HeatmapMap from '../../components/HeatmapMap';
import { motion } from 'framer-motion';

const ModeratorHeatmap = () => {
  const [points, setPoints] = useState([]);
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
      
      {/* Admin Map Header */}
      <header className="px-lg-5 px-3 py-4 bg-white border-bottom shadow-sm" style={{ zIndex: 10 }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
               <span className="px-2 py-0 rounded bg-primary text-white fw-black" style={{ fontSize: '0.6rem', letterSpacing: '1px' }}>ADMIN</span>
               <span className="text-muted small fw-bold">SPATIAL COMMAND</span>
            </div>
            <h1 className="fw-black mb-0 text-dark" style={{ fontSize: '1.8rem', letterSpacing: '-1px' }}>OPERATIONAL HEATMAP<span style={{ color: '#FF7A45' }}>.</span></h1>
          </div>

          <div className="d-flex align-items-center gap-3">
             <div className="d-flex align-items-center bg-light px-3 py-2 rounded-pill gap-3 border border-light">
                <div className="form-check form-switch mb-0 d-flex align-items-center gap-2">
                   <input className="form-check-input mt-0 cursor-pointer" type="checkbox" checked={showHeatmap} onChange={e => setShowHeatmap(e.target.checked)} />
                   <label className="small fw-black text-muted text-uppercase mb-0" style={{ fontSize: '0.65rem' }}>Density</label>
                </div>
                <div className="vr opacity-10" style={{ height: '16px' }}></div>
                <div className="form-check form-switch mb-0 d-flex align-items-center gap-2">
                   <input className="form-check-input mt-0 cursor-pointer" type="checkbox" checked={showMarkers} onChange={e => setShowMarkers(e.target.checked)} />
                   <label className="small fw-black text-muted text-uppercase mb-0" style={{ fontSize: '0.65rem' }}>Pins</label>
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

      {/* Map View */}
      <div className="flex-grow-1 position-relative">
         {loading && (
           <div className="position-absolute top-50 start-50 translate-middle z-3 bg-white p-3 rounded-circle shadow-lg">
              <div className="spinner-border text-dark spinner-border-sm"></div>
           </div>
         )}
         <HeatmapMap points={points} showHeatmap={showHeatmap} showMarkers={showMarkers} />
         
         {/* Floating Stats Card */}
         <div className="position-absolute bottom-0 start-0 m-4 z-3 d-none d-lg-block">
            <div className="bg-white p-4 shadow-xl border border-light" style={{ borderRadius: '24px', width: '280px' }}>
               <div className="small fw-black text-muted text-uppercase mb-2">Live Statistics</div>
               <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="small fw-bold">Active Hotspots</span>
                  <span className="fw-black text-danger">4</span>
               </div>
               <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="small fw-bold">Current Density</span>
                  <span className="fw-black text-primary">NORMAL</span>
               </div>
               <div className="progress" style={{ height: '4px' }}>
                  <div className="progress-bar bg-primary" style={{ width: '65%' }}></div>
               </div>
            </div>
         </div>
      </div>

      <style>{`
        .fw-black { font-weight: 900; }
        .cursor-pointer { cursor: pointer; }
        .shadow-xl { box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
      `}</style>
    </div>
  );
};

export default ModeratorHeatmap;
