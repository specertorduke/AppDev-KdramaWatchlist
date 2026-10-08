import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2, ListVideo } from 'lucide-react';
import { useWatchlist } from '../context/WatchlistContext.jsx';

export default function Player({ tmdbId, type = 'tv', season = 1, episode = 1, allSeasons = [], onClose, onEpisodeWatched }) {
  const { isInWatchlist, getWatchlistItem } = useWatchlist();
  
  const [currentSeasonNum, setCurrentSeasonNum] = useState(season);
  const [currentEpisodeNum, setCurrentEpisodeNum] = useState(episode);
  const syncedRef = useRef(false);

  useEffect(() => {
    // Only set on initial mount or if they are undefined
    if (currentSeasonNum === undefined) setCurrentSeasonNum(season);
    if (currentEpisodeNum === undefined) setCurrentEpisodeNum(episode);
  }, []);

  let videoSrc = `https://vidlink.pro/movie/${tmdbId}?autoplay=true&primaryColor=eb5b78`;
  if (type === 'tv') {
    videoSrc = `https://vidlink.pro/tv/${tmdbId}/${currentSeasonNum || season}/${currentEpisodeNum || episode}?autoplay=true&primaryColor=eb5b78`;
  }

  const currentSeasonData = allSeasons.find(s => s.season_number === currentSeasonNum) || {};
  const episodesCount = currentSeasonData.episode_count || 16;

  const handleSeasonChange = (e) => {
    setCurrentSeasonNum(Number(e.target.value));
    setCurrentEpisodeNum(1);
    syncedRef.current = false;
  };
  
  const handleEpisodeChange = (e) => {
    setCurrentEpisodeNum(Number(e.target.value));
    syncedRef.current = false;
  };

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
            
            if (onEpisodeWatched) {
              onEpisodeWatched(currentSeasonNum, currentEpisodeNum);
            }
          }
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [tmdbId, type, currentSeasonNum, currentEpisodeNum, onEpisodeWatched]);

  return (
    <div className="sarang-player-overlay" role="dialog" aria-modal="true" aria-label="SarangTV video player">
      <header className="sarang-player-header">
        <div className="sarang-player-brand-pill">
          <img src="/logo.png" alt="SarangTV" className="sarang-player-logo" />
          <span>SarangTV Player</span>
        </div>

        {type === 'tv' && allSeasons.length > 0 && (
          <div className="sarang-player-selectors" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginLeft: 'auto', marginRight: '20px', pointerEvents: 'auto' }}>
            <div className="player-select-wrap" style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.6)', borderRadius: '6px', padding: '6px 10px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <ListVideo size={16} style={{ marginRight: '8px', color: '#a097a8' }} />
              <select 
                value={currentSeasonNum} 
                onChange={handleSeasonChange}
                style={{ background: 'transparent', color: '#F0EEE8', border: 'none', outline: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
              >
                {allSeasons.map(s => (
                  <option key={s.id || s.season_number} value={s.season_number} style={{ color: '#000' }}>
                    {s.name || `Season ${s.season_number}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="player-select-wrap" style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.6)', borderRadius: '6px', padding: '6px 10px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <select 
                value={currentEpisodeNum} 
                onChange={handleEpisodeChange}
                style={{ background: 'transparent', color: '#F0EEE8', border: 'none', outline: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
              >
                {Array.from({ length: episodesCount }, (_, i) => i + 1).map(ep => (
                  <option key={ep} value={ep} style={{ color: '#000' }}>
                    Episode {ep}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="sarang-player-close-btn"
          aria-label="Back"
          style={type === 'tv' && allSeasons.length > 0 ? {} : { marginLeft: 'auto' }}
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
