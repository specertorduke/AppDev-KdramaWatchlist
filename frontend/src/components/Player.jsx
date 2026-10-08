import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2, ListVideo, Server, CheckSquare, Info } from 'lucide-react';
import { useWatchlist } from '../context/WatchlistContext.jsx';

export default function Player({ tmdbId, type = 'tv', season = 1, episode = 1, allSeasons = [], onClose, onEpisodeWatched }) {
  const { isInWatchlist, getWatchlistItem } = useWatchlist();
  
  const [currentSeasonNum, setCurrentSeasonNum] = useState(season);
  const [currentEpisodeNum, setCurrentEpisodeNum] = useState(episode);
  const [currentServer, setCurrentServer] = useState('vidlink');
  const syncedRef = useRef(false);

  useEffect(() => {
    // Only set on initial mount or if they are undefined
    if (currentSeasonNum === undefined) setCurrentSeasonNum(season);
    if (currentEpisodeNum === undefined) setCurrentEpisodeNum(episode);
  }, []);

  let videoSrc = '';
  if (currentServer === 'vidlink') {
    videoSrc = `https://vidlink.pro/movie/${tmdbId}?autoplay=true&primaryColor=eb5b78`;
    if (type === 'tv') {
      videoSrc = `https://vidlink.pro/tv/${tmdbId}/${currentSeasonNum || season}/${currentEpisodeNum || episode}?autoplay=true&primaryColor=eb5b78`;
    }
  } else if (currentServer === 'vidsrc') {
    videoSrc = `https://vidsrc.to/embed/movie/${tmdbId}`;
    if (type === 'tv') {
      videoSrc = `https://vidsrc.to/embed/tv/${tmdbId}/${currentSeasonNum || season}/${currentEpisodeNum || episode}`;
    }
  } else if (currentServer === 'vidsrcme') {
    videoSrc = `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`;
    if (type === 'tv') {
      videoSrc = `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${currentSeasonNum || season}&episode=${currentEpisodeNum || episode}`;
    }
  } else if (currentServer === 'vidsrccc') {
    videoSrc = `https://vidsrc.cc/v3/embed/movie/${tmdbId}`;
    if (type === 'tv') {
      videoSrc = `https://vidsrc.cc/v3/embed/tv/${tmdbId}/${currentSeasonNum || season}/${currentEpisodeNum || episode}`;
    }
  } else if (currentServer === 'autoembed') {
    videoSrc = `https://player.autoembed.cc/embed/movie/${tmdbId}`;
    if (type === 'tv') {
      videoSrc = `https://player.autoembed.cc/embed/tv/${tmdbId}/${currentSeasonNum || season}/${currentEpisodeNum || episode}`;
    }
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

  const handleManualNext = () => {
    if (onEpisodeWatched) {
      onEpisodeWatched(currentSeasonNum, currentEpisodeNum);
    }
    
    if (currentEpisodeNum < episodesCount) {
      setCurrentEpisodeNum(currentEpisodeNum + 1);
    } else {
      // Try next season if it exists
      const nextSeasonData = allSeasons.find(s => s.season_number === currentSeasonNum + 1);
      if (nextSeasonData) {
        setCurrentSeasonNum(nextSeasonData.season_number);
        setCurrentEpisodeNum(1);
      } else {
        onClose(); // Close if no more seasons
      }
    }
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

        <div className="sarang-player-selectors" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginLeft: 'auto', marginRight: '20px', pointerEvents: 'auto' }}>
          {currentServer !== 'vidlink' && (
            <div style={{ background: 'rgba(255, 170, 0, 0.15)', color: '#ffb84d', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(255, 170, 0, 0.3)', fontWeight: 500 }}>
              <Info size={14} />
              <span className="hide-on-mobile">Auto-sync disabled on backup server</span>
            </div>
          )}
          
          <div className="player-select-wrap" style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.6)', borderRadius: '6px', padding: '6px 10px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <Server size={16} style={{ marginRight: '8px', color: '#a097a8' }} />
            <select 
              value={currentServer} 
              onChange={(e) => setCurrentServer(e.target.value)}
              style={{ background: 'transparent', color: '#F0EEE8', border: 'none', outline: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
            >
              <option value="vidlink" style={{ color: '#000' }}>VidLink (Primary)</option>
              <option value="vidsrc" style={{ color: '#000' }}>VidSrc (.to)</option>
              <option value="vidsrcme" style={{ color: '#000' }}>VidSrc (.me)</option>
              <option value="vidsrccc" style={{ color: '#000' }}>VidSrc (.cc)</option>
              <option value="autoembed" style={{ color: '#000' }}>AutoEmbed</option>
            </select>
          </div>

          {type === 'tv' && allSeasons.length > 0 && (
            <>
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
            </>
          )}

          {type === 'tv' && (
            <button
              onClick={handleManualNext}
              title="Mark as watched and play next episode"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(235,91,120,0.9)', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', marginLeft: '4px', transition: 'background 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.background = '#eb5b78'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(235,91,120,0.9)'}
            >
              <CheckSquare size={16} />
              Next & Check
            </button>
          )}
        </div>

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
