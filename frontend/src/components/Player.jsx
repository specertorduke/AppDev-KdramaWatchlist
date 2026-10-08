import React from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function Player({ tmdbId, type = 'tv', season = 1, episode = 1, onClose }) {
  let videoSrc = `https://vidlink.pro/movie/${tmdbId}?autoplay=true`;
  if (type === 'tv') {
    videoSrc = `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?autoplay=true`;
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: '#000', display: 'flex', flexDirection: 'column', zIndex: 99999 }}>
      <header style={{ padding: '20px', position: 'absolute', top: 0, left: 0, zIndex: 100000, display: 'flex', alignItems: 'center' }}>
        <button 
          onClick={onClose}
          style={{ 
            background: 'rgba(255, 255, 255, 0.1)', 
            backdropFilter: 'blur(8px)',
            color: 'white', 
            border: '1px solid rgba(255,255,255,0.2)', 
            borderRadius: '50%', 
            width: '44px',
            height: '44px',
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
      </header>

      {/* Loading Placeholder */}
      <div style={{ 
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        zIndex: 99998, pointerEvents: 'none' 
      }}>
        <Loader2 className="spinner-icon" size={40} style={{ color: 'rgba(255,255,255,0.5)', animation: 'spin 1s linear infinite' }} />
      </div>

      <iframe
        src={videoSrc}
        style={{ width: '100%', height: '100%', border: 'none', position: 'relative', zIndex: 99999 }}
        allowFullScreen
        title="VidLink Player"
      />
    </div>
  );
}
