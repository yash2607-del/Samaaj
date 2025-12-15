import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHome, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #FFB347 0%, #FFD8A8 50%, #FFE4C4 100%)',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        textAlign: 'center'
      }}>
        {/* Animated 404 */}
        <div style={{
          position: 'relative',
          marginBottom: '2rem'
        }}>
          <h1 style={{
            fontSize: '10rem',
            fontWeight: '900',
            color: 'rgba(255, 255, 255, 0.15)',
            margin: 0,
            lineHeight: 1,
            letterSpacing: '-0.05em'
          }}>404</h1>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FiAlertCircle style={{ 
              fontSize: '4rem', 
              color: 'white',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
            }} />
          </div>
        </div>

        {/* Error Message */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '3rem 2rem',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)'
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#1a1a1a',
            marginBottom: '1rem',
            letterSpacing: '-0.5px'
          }}>
            Page Not Found
          </h2>
          <p style={{
            fontSize: '1rem',
            color: '#616161',
            marginBottom: '2rem',
            lineHeight: '1.6'
          }}>
            Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or the URL might be incorrect.
          </p>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.875rem 1.75rem',
                background: 'transparent',
                color: '#FFB347',
                border: '2px solid #FFB347',
                borderRadius: '10px',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#FFF8F0';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <FiArrowLeft />
              Go Back
            </button>
            <button
              onClick={() => navigate('/')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.875rem 1.75rem',
                background: 'linear-gradient(135deg, #FFB347, #FFD8A8)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(255, 111, 0, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(255, 111, 0, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(255, 111, 0, 0.3)';
              }}
            >
              <FiHome />
              Go to Home
            </button>
          </div>
        </div>

        {/* Decorative Elements */}
        <div style={{
          marginTop: '2rem',
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '0.875rem'
        }}>
          <p style={{ margin: 0 }}>Need help? Contact support@samaaj.com</p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
