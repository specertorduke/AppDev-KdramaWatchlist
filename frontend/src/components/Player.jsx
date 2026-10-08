import React, { useEffect, useRef } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useWatchlist } from '../context/WatchlistContext.jsx';

export default function Player({ tmdbId, type = 'tv', season = 1, episode = 1, onClose }) {
  const { updateWatchlist, isInWatchlist, getWatchlistItem } = useWatchlist();
  const syncedRef = useRef(false);

  let videoSrc = `https://vidlink.pro/movie/${tmdbId}?autoplay=true&primaryColor=eb5b78`;
  if (type === 'tv') {
    videoSrc = `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?autoplay=true&primaryColor=eb5b78`;
  }

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('sarangtv:video-player-state', { detail: { active: true } }));
    return () => {
      window.dispatchEvent(new CustomEvent('sarangtv:video-player-state', { detail: { active: false } }));
    };
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== 'https://vidlink.pro') return;
      
      if (event.data?.type === 'PLAYER_EVENT') {
        const payload = event.data.data || {};
        const { event: playerEvent, currentTime, duration } = payload;
        
        if (playerEvent === 'ended' || playerEvent === 'timeupdate') {
          const isNearEnd = currentTime && duration && (currentTime / duration) > 0.90;
          if ((playerEvent === 'ended' || isNearEnd) && !syncedRef.current) {
            syncedRef.current = true;
            
            if (isInWatchlist(tmdbId)) {
               const item = getWatchlistItem(tmdbId);
               if (type === 'tv') {
                 if (item && item.current_episode < episode) {
                   const totalEps = item.episodes || item.total_episodes || 16;
                   const isCompleted = episode >= totalEps;
                   updateWatchlist(tmdbId, { 
                     current_episode: episode, 
                     status: isCompleted ? 'Completed' : 'Watching' 
                   });
                 }
               } else if (type === 'movie') {
                 if (item && item.status !== 'Completed') {
                   updateWatchlist(tmdbId, { status: 'Completed', current_episode: 1 });
                 }
               }
            }
          }
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [tmdbId, type, episode, updateWatchlist, isInWatchlist, getWatchlistItem]);

  return (
    <div className="sarang-player-overlay" role="dialog" aria-modal="true" aria-label="SarangTV video player">
      <header className="sarang-player-header">
        <div className="sarang-player-brand-pill">
          <img src="/logo.png" alt="SarangTV" className="sarang-player-logo" />
          <span>SarangTV Player</span>
        </div>
        <button
          onClick={onClose}
          className="sarang-player-close-btn"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
      </header>

      {/* Loading Placeholder */}
      <div className="sarang-player-loading" aria-hidden="true">
        <Loader2 className="spinner-icon sarang-player-spinner" size={40} />
      </div>

      <iframe
        src={videoSrc}
        className="sarang-player-frame"
        allowFullScreen
        title="VidLink Player"
      />
    </div>
  );
}
