import {
  Bookmark,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ClipboardList,
  BarChart3,
  Edit3,
  Pause,
  Play,
  Plus,
  Search,
  Send,
  LogOut,
  X,
  Sparkles,
  Film,
  Star,
  CheckCircle2,
  Heart,
  Loader2,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useWatchlist } from '../context/WatchlistContext.jsx'
import discoverService, {
  mapDramaCard,
  mapDramaDetail,
  DEFAULT_POSTER_IMAGE,
  DEFAULT_BACKDROP_IMAGE,
} from '../services/discoverService.js'
import {
  dashboardUser,
  quickAccess,
} from '../data/dashboardData.js'
import EditProfileModal from './EditProfileModal.jsx'
import Chatbot from './Chatbot.jsx'

const statIcons = { bookmark: Bookmark, play: Play, check: Check, clock: Clock3 }
const quickIcons = { clipboard: ClipboardList, plus: Plus, pause: Pause, send: Send }

function AddDramaModal({ isOpen, onClose, onDramaAdded }) {
  const { addToWatchlist, isInWatchlist } = useWatchlist()
  const [query, setQuery] = useState('')
  const [addedIds, setAddedIds] = useState({})
  const [toastMessage, setToastMessage] = useState('')
  const [dramas, setDramas] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Manage body scroll locking
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Fetch API dramas when modal opens or search query changes
  useEffect(() => {
    if (!isOpen) return

    let isCancelled = false
    const trimmed = query.trim()

    if (trimmed) {
      setIsSearching(true)
      const timeout = setTimeout(async () => {
        try {
          const res = await discoverService.searchDramas({ query: trimmed })
          if (!isCancelled) {
            if (res?.data && res.data.length > 0) {
              const mapped = res.data.map((d, index) => mapDramaCard(d, index))
              setDramas(mapped)
            } else {
              setDramas([])
            }
          }
        } catch {
          if (!isCancelled) setDramas([])
        } finally {
          if (!isCancelled) setIsSearching(false)
        }
      }, 300)

      return () => {
        isCancelled = true
        clearTimeout(timeout)
      }
    } else {
      setIsSearching(true)
      discoverService
        .getDiscover({ page: 1 })
        .then((res) => {
          if (!isCancelled) {
            if (res?.data && res.data.length > 0) {
              const mapped = res.data.map((d, index) => mapDramaCard(d, index))
              setDramas(mapped)
            } else {
              setDramas([])
            }
          }
        })
        .catch(() => {
          if (!isCancelled) setDramas([])
        })
        .finally(() => {
          if (!isCancelled) setIsSearching(false)
        })

      return () => {
        isCancelled = true
      }
    }
  }, [isOpen, query])

  const handleAdd = async (drama) => {
    const dramaId = drama.tmdb_id || drama.id
    setAddedIds((prev) => ({ ...prev, [dramaId]: true }))
    setToastMessage(`"${drama.title}" added to your Plan to Watch list!`)

    const addedItem = await addToWatchlist(drama, 'Plan')
    onDramaAdded?.(addedItem || drama)

    setTimeout(() => {
      setToastMessage('')
    }, 3000)
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="add-drama-modal-title">
      <div className="add-drama-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="add-drama-header">
          <div className="add-drama-title-group">
            <div className="add-drama-badge">
              <Sparkles size={14} /> Quick Add
            </div>
            <h2 id="add-drama-modal-title">Add Drama to Watchlist</h2>
            <p>Search K-dramas by title or actor and quickly add them to your tracker.</p>
          </div>
          <button className="modal-close-button" type="button" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="modal-search-wrapper">
          <div className="modal-search-box">
            <Search className="search-input-icon" size={18} />
            <input
              type="text"
              placeholder="Search by title, actor (e.g. Queen of Tears, Goblin)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {query && (
              <button
                type="button"
                className="search-clear-button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Toast Feedback */}
        {toastMessage && (
          <div className="modal-toast" role="status">
            <CheckCircle2 size={16} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Results List */}
        <div className="modal-results-container">
          <div className="modal-results-count">
            <span>{dramas.length} {dramas.length === 1 ? 'drama' : 'dramas'} available</span>
            {isSearching && (
              <Loader2
                size={15}
                style={{
                  display: 'inline-block',
                  marginLeft: '8px',
                  verticalAlign: 'middle',
                  animation: 'spin 1s linear infinite',
                  color: '#eb5b78',
                }}
              />
            )}
          </div>

          {isSearching && dramas.length === 0 ? (
            <div className="modal-empty-state">
              <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: '#eb5b78' }} />
              <p>Searching K-Drama catalog...</p>
            </div>
          ) : dramas.length > 0 ? (
            <div className="modal-results-grid">
              {dramas.map((drama) => {
                const dramaId = drama.tmdb_id || drama.id
                const isAdded = !!addedIds[dramaId] || isInWatchlist(dramaId)
                return (
                  <article className="modal-drama-card" key={dramaId}>
                    <div className="modal-drama-poster" style={{ backgroundImage: `url(${drama.image})` }}>
                      <span className="modal-rating-badge">★ {drama.rating}</span>
                    </div>

                    <div className="modal-drama-info">
                      <div className="modal-drama-top">
                        <h3>{drama.title}</h3>
                        <span className="modal-drama-meta">
                          {drama.year} · {drama.genres?.slice(0, 2).join(' · ') || 'K-Drama'}
                        </span>
                      </div>

                      <div className="modal-drama-tags">
                        {drama.genres?.slice(0, 3).map((g) => (
                          <span className="genre-pill" key={g}>{g}</span>
                        ))}
                      </div>

                      <p className="modal-drama-synopsis">{drama.overview || drama.synopsis}</p>

                      <div className="modal-drama-bottom">
                        <button
                          type="button"
                          className={`modal-add-button ${isAdded ? 'added' : ''}`}
                          onClick={() => !isAdded && handleAdd(drama)}
                          disabled={isAdded}
                          aria-label={isAdded ? `${drama.title} added` : `Add ${drama.title}`}
                        >
                          {isAdded ? (
                            <>
                              <Check size={16} /> Added
                            </>
                          ) : (
                            <>
                              <Plus size={16} /> Add to List
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="modal-empty-state">
              <Film size={40} />
              <h3>No dramas found</h3>
              <p>{query ? `We couldn't find any K-dramas matching "${query}". Try searching another title or actor!` : 'No K-dramas available at the moment.'}</p>
              {query && (
                <button
                  type="button"
                  className="button button-outline button-small"
                  onClick={() => setQuery('')}
                >
                  Reset search
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DashboardHeader({ activeTab, onOpenAddDrama }) {
  const [profileOpen, setProfileOpen] = useState(false)
  const { user } = useAuth()

  const displayName = user?.name || dashboardUser.name
  const avatarUrl = user?.avatar || dashboardUser.avatar

  return (
    <header className="dashboard-header">
      <Link className="dashboard-brand" to="/">SarangTV</Link>
      <nav className="dashboard-nav" aria-label="Dashboard navigation">
        <Link className={activeTab === 'home' ? 'active' : ''} to="/dashboard">Home</Link>
        <Link className={activeTab === 'discover' ? 'active' : ''} to="/discover">Discover</Link>
        <Link className={activeTab === 'tracker' ? 'active' : ''} to="/tracker">Tracker</Link>
        <Link className={activeTab === 'profile' ? 'active' : ''} to="/profile">Profile</Link>
      </nav>
      <div className="dashboard-actions">
        <button type="button" aria-label="Search dramas" onClick={onOpenAddDrama}>
          <Search size={20} />
        </button>
        <button className="profile-avatar" type="button" aria-label="Open profile" onClick={() => setProfileOpen((open) => !open)}>
          <img src={avatarUrl} alt={displayName} />
        </button>
      </div>
      {profileOpen && <ProfileMenu onClose={() => setProfileOpen(false)} />}
    </header>
  )
}

function ProfileMenu({ onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    onClose?.()
    await logout()
    navigate('/login')
  }

  return (
    <div className="profile-menu">
      <div className="profile-menu-user">
        <strong>{user?.name || 'K-Drama Fan'}</strong>
        <span>{user?.email || 'user@sarangtv.app'}</span>
      </div>
      <Link to="/tracker" onClick={onClose}>My Tracker</Link>
      <Link to="/stats" onClick={onClose}>Stats & History</Link>
      <Link to="/profile" onClick={onClose}>Profile</Link>
      <button type="button" onClick={handleLogout}>
        <LogOut size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
        Sign Out
      </button>
    </div>
  )
}

function StatCard({ stat }) {
  const Icon = statIcons[stat.icon]
  return (
    <article className={`dashboard-stat stat-${stat.tone}`}>
      <Icon className="stat-icon" size={16} />
      <strong>{stat.value}</strong>
      <span>{stat.label}</span>
      <small>{stat.detail}</small>
    </article>
  )
}

function CircularProgressAvatar({ src, progress = 19, size = 68, strokeWidth = 4 }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="circular-avatar-wrapper" style={{ width: size, height: size }}>
      <svg className="progress-ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="progress-ring-bg"
          stroke="#262533"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="progress-ring-fill"
          stroke="#32d19a"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <img className="circular-avatar-img" src={src} alt="" />
    </div>
  )
}

function CurrentDrama({ onDetailsClick }) {
  const { stats, updateWatchlist } = useWatchlist()
  const navigate = useNavigate()
  const active = stats.currentlyWatching

  if (!active) {
    return (
      <article className="current-drama" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="current-drama-content" style={{ padding: '24px' }}>
          <div className="watching-label"><i /> Watching progress</div>
          <div style={{ marginTop: '14px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '17px', color: '#f0ecf3', margin: '0 0 6px', fontFamily: 'Georgia, serif' }}>
              No drama currently watching
            </h3>
            <p style={{ fontSize: '13px', color: '#8c8697', margin: 0, lineHeight: 1.5 }}>
              Add a K-Drama to your tracker and set its status as Watching to track your episodes.
            </p>
          </div>
          <div className="current-drama-footer" style={{ borderTop: 0, paddingTop: 0 }}>
            <span>Tracked<strong>{stats.totalTracked} dramas</strong></span>
            <div>
              <button
                className="log-button"
                type="button"
                onClick={() => navigate('/discover')}
              >
                <Search size={14} /> Explore Catalog
              </button>
            </div>
          </div>
        </div>
      </article>
    )
  }

  const avatarImg = active.poster || active.image || DEFAULT_POSTER_IMAGE
  const backdropImg = active.backdrop || active.image || DEFAULT_BACKDROP_IMAGE
  const progressVal = typeof active.progress === 'number' ? active.progress : 0
  const curEp = active.current_episode || 1
  const totalEps = active.episodes || 16

  const handleLogNextEp = () => {
    if (curEp < totalEps) {
      updateWatchlist(active.tmdb_id || active.id, {
        current_episode: curEp + 1,
        watchedCount: curEp + 1,
      })
    } else {
      updateWatchlist(active.tmdb_id || active.id, {
        status: 'Completed',
        current_episode: totalEps,
        watchedCount: totalEps,
      })
    }
  }

  return (
    <article className="current-drama">
      <div className="current-drama-image" style={{ backgroundImage: `url(${backdropImg})` }} />
      <div className="current-drama-content">
        <div className="watching-label"><i /> Watching progress</div>
        <div className="current-show-row">
          <CircularProgressAvatar
            src={avatarImg}
            progress={progressVal}
            size={68}
            strokeWidth={4.5}
          />
          <div>
            <h3>{active.title}</h3>
            <p>Ep {curEp} of {totalEps} · ~60 min</p>
            <div className="progress-row">
              <div className="progress-bar"><span style={{ width: `${progressVal}%` }} /></div>
              <b>{progressVal}%</b>
            </div>
          </div>
        </div>
        <div className="current-drama-footer">
          <span>Logged<strong>{active.logged || 'Recently'}</strong></span>
          <div>
            <button className="detail-button" type="button" onClick={() => onDetailsClick?.(active)}>Details</button>
            <button className="log-button" type="button" onClick={handleLogNextEp}>
              <Check size={15} /> Log Ep {Math.min(curEp + 1, totalEps)}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

function QuickAccess({ onOpenAddDrama }) {
  const navigate = useNavigate()

  const handleQuickClick = (item) => {
    if (item.label === 'My Tracker') {
      navigate('/tracker')
    } else if (item.label === 'Add Drama') {
      onOpenAddDrama?.()
    } else if (item.label === 'On Hold') {
      navigate('/tracker?filter=on-hold')
    } else if (item.label === 'Plan to Watch') {
      navigate('/tracker?filter=plan')
    }
  }

  return (
    <section className="dashboard-section quick-section" aria-labelledby="quick-heading">
      <h2 id="quick-heading">Quick access</h2>
      <div className="quick-grid">
        {quickAccess.map((item) => {
          const Icon = quickIcons[item.icon]
          return (
            <button
              className={`quick-card quick-${item.tone}`}
              type="button"
              key={item.label}
              onClick={() => handleQuickClick(item)}
            >
              <span><Icon size={22} /></span>
              {item.label}
              <ChevronRight size={17} />
            </button>
          )
        })}
      </div>
    </section>
  )
}

function DramaCard({ drama }) {
  return (
    <article className="drama-card">
      <div className="drama-poster" style={{ backgroundImage: `url(${drama.image})` }}>
        <span className={`rank rank-${drama.tone}`}>{drama.rank}</span>
        <strong className="drama-rating">★ {drama.rating}</strong>
      </div>
      <h3>{drama.title}</h3>
      <p>{drama.meta}</p>
    </article>
  )
}

function DramaDetailView({ drama, onBack }) {
  const { getWatchlistItem, updateWatchlist, addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist()
  const dramaId = drama.tmdb_id || drama.id
  const savedItem = getWatchlistItem(dramaId)
  const isTracked = Boolean(savedItem) || isInWatchlist(dramaId)

  const [status, setStatus] = useState(savedItem?.status || (isTracked ? (drama.status || 'Plan to Watch') : null))
  const [myRating, setMyRating] = useState(savedItem?.rating || drama.myRating || 0)
  const [hoverRating, setHoverRating] = useState(0)
  const [isFavorite, setIsFavorite] = useState(savedItem?.is_favorite || false)
  const [myNotes, setMyNotes] = useState(savedItem?.notes || drama.myNotes || '')
  const [noteSaved, setNoteSaved] = useState(false)
  const [episodesList, setEpisodesList] = useState(() => {
    const total = drama.episodes || 16
    const watched = savedItem?.watchedCount || (savedItem?.status === 'Watching' ? 1 : 0)
    return Array.from({ length: Math.min(total, 32) }, (_, i) => ({
      number: i + 1,
      title: `Episode ${i + 1}`,
      watched: i < watched,
    }))
  })

  const watchedCount = episodesList.filter((ep) => ep.watched).length
  const totalEpisodes = drama.episodes || episodesList.length || 16
  const progressPct = totalEpisodes > 0 ? Math.round((watchedCount / totalEpisodes) * 100) : 0

  const handleAddToWatchlist = (initialStatus = 'Plan to Watch') => {
    addToWatchlist(drama, initialStatus)
    setStatus(initialStatus)
  }

  const handleStatusChange = (newStatus) => {
    setStatus(newStatus)
    if (savedItem || isTracked) {
      updateWatchlist(dramaId, { status: newStatus })
    } else {
      addToWatchlist(drama, newStatus)
    }
  }

  const handleRatingChange = (newRating) => {
    setMyRating(newRating)
    if (savedItem || isTracked) {
      updateWatchlist(dramaId, { rating: newRating })
    } else {
      addToWatchlist({ ...drama, myRating: newRating }, status || 'Plan to Watch')
      if (!status) setStatus('Plan to Watch')
    }
  }

  const toggleEpisode = (epNum) => {
    setEpisodesList((prev) => {
      const updated = prev.map((ep) => (ep.number === epNum ? { ...ep, watched: !ep.watched } : ep))
      const newWatchedCount = updated.filter((ep) => ep.watched).length
      const newStatus = newWatchedCount === totalEpisodes ? 'Completed' : (newWatchedCount > 0 ? 'Watching' : (status || 'Plan to Watch'))
      setStatus(newStatus)

      if (savedItem || isTracked) {
        updateWatchlist(dramaId, {
          watchedCount: newWatchedCount,
          current_episode: newWatchedCount,
          status: newStatus,
        })
      } else {
        addToWatchlist({ ...drama, watchedCount: newWatchedCount, current_episode: newWatchedCount }, newStatus)
      }
      return updated
    })
  }

  const handleSaveNotes = () => {
    setNoteSaved(true)
    if (savedItem || isTracked) {
      updateWatchlist(dramaId, { notes: myNotes })
    } else {
      addToWatchlist({ ...drama, myNotes }, status || 'Plan to Watch')
      if (!status) setStatus('Plan to Watch')
    }
    setTimeout(() => setNoteSaved(false), 2200)
  }

  const handleToggleFavorite = () => {
    const nextFav = !isFavorite
    setIsFavorite(nextFav)
    if (savedItem || isTracked) {
      updateWatchlist(dramaId, { is_favorite: nextFav })
    } else {
      addToWatchlist({ ...drama, is_favorite: nextFav }, status || 'Plan to Watch')
      if (!status) setStatus('Plan to Watch')
    }
  }

  const statusOptions = ['Watching', 'Completed', 'Plan to Watch', 'On Hold', 'Dropped']

  return (
    <div className="drama-detail-container">
      {/* Top Back Navigation */}
      <div className="detail-top-nav">
        <button className="detail-back-btn" type="button" onClick={onBack}>
          <ChevronLeft size={16} /> Back
        </button>
      </div>

      {/* Drama Header Section */}
      <section className="detail-header-section">
        <div className="detail-poster-wrapper">
          <img
            className="detail-poster-img"
            src={drama.poster || drama.image || savedItem?.poster || savedItem?.image || DEFAULT_POSTER_IMAGE}
            alt={drama.title}
          />
        </div>

        <div className="detail-header-info">
          <div className="detail-badges-row">
            <span className="detail-badge-rank">{drama.rankBadge || `TOP ${drama.rank || 1}`}</span>
            <span className={`detail-badge-status ${!isTracked ? 'status-catalog' : ''}`}>
              {isTracked ? (status || 'In Watchlist') : 'Not in Watchlist'}
            </span>
          </div>

          <h1 className="detail-main-title">{drama.title}</h1>
          {(drama.nativeTitle || savedItem?.nativeTitle) && (
            <p className="detail-native-title">{drama.nativeTitle || savedItem?.nativeTitle}</p>
          )}

          <div className="detail-meta-line">
            <span>{drama.year}</span>
            <span className="meta-dot">·</span>
            <span>{drama.network}</span>
            <span className="meta-dot">·</span>
            <span>{totalEpisodes} Episodes</span>
            <span className="meta-dot">·</span>
            <span className="meta-star-rating">★ {drama.rating} <em>/ 10</em></span>
          </div>

          <p className="detail-available-on">Available on {drama.availableOn || drama.network}</p>

          <div className="detail-header-actions">
            {!isTracked ? (
              <button
                className="detail-update-status-button detail-add-button"
                type="button"
                onClick={() => handleAddToWatchlist('Plan to Watch')}
              >
                <Plus size={16} /> Add to Watchlist
              </button>
            ) : (
              <>
                <button
                  className="detail-update-status-button"
                  type="button"
                  onClick={() => handleStatusChange(status === 'Completed' ? 'Watching' : 'Completed')}
                >
                  {status === 'Completed' ? (
                    <>
                      <Play size={15} /> Set as Watching
                    </>
                  ) : (
                    <>
                      <Check size={16} /> Mark Completed
                    </>
                  )}
                </button>
                <button
                  className="detail-remove-button"
                  type="button"
                  onClick={() => {
                    removeFromWatchlist(dramaId)
                    setStatus(null)
                  }}
                  title="Remove from Watchlist"
                >
                  <Trash2 size={16} /> Remove
                </button>
              </>
            )}
            <button
              className={`detail-heart-button ${isFavorite ? 'active' : ''}`}
              type="button"
              onClick={handleToggleFavorite}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart size={18} fill={isFavorite ? '#eb5b78' : 'none'} color={isFavorite ? '#eb5b78' : '#8e889b'} />
            </button>
          </div>
        </div>
      </section>

      {/* 2-Column Content Grid */}
      <div className="detail-content-grid">
        {/* Left Column: Synopsis, Details, Cast */}
        <div className="detail-left-col">
          {/* Synopsis */}
          <article className="detail-card">
            <h3 className="detail-card-heading">SYNOPSIS</h3>
            <p className="detail-synopsis-content">{drama.synopsis}</p>
          </article>

          {/* Details */}
          <article className="detail-card">
            <h3 className="detail-card-heading">DETAILS</h3>
            <div className="detail-key-value-list">
              <div className="detail-kv-row">
                <span className="kv-key">Native Title</span>
                <span className="kv-val">{drama.nativeTitle || '—'}</span>
              </div>
              <div className="detail-kv-row">
                <span className="kv-key">Genres</span>
                <span className="kv-val">{drama.genres || '—'}</span>
              </div>
              <div className="detail-kv-row">
                <span className="kv-key">Director</span>
                <span className="kv-val">{drama.director || '—'}</span>
              </div>
              <div className="detail-kv-row">
                <span className="kv-key">Aired</span>
                <span className="kv-val">{drama.year || '—'}</span>
              </div>
              <div className="detail-kv-row">
                <span className="kv-key">Duration</span>
                <span className="kv-val">{drama.duration || '60 min / ep'}</span>
              </div>
              <div className="detail-kv-row">
                <span className="kv-key">Network</span>
                <span className="kv-val">{drama.network || '—'}</span>
              </div>
            </div>
          </article>

          {/* Main Cast */}
          <article className="detail-card">
            <h3 className="detail-card-heading">MAIN CAST</h3>
            <div className="detail-cast-list">
              {drama.cast && drama.cast.length > 0 ? (
                drama.cast.map((actor) => (
                  <div className="cast-row" key={actor.name}>
                    <img className="cast-avatar" src={actor.avatar} alt={actor.name} />
                    <div className="cast-text">
                      <strong>{actor.name}</strong>
                      <span>as {actor.role}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="cast-empty">Cast info available soon.</p>
              )}
            </div>
          </article>
        </div>

        {/* Right Column: Progress, Status, Rating, Notes, Episodes */}
        <div className="detail-right-col">
          {/* Progress & Tracking Card */}
          <article className="detail-card">
            <div className="detail-progress-header">
              <h3 className="detail-card-heading">PROGRESS</h3>
              <span className="progress-header-meta">
                {watchedCount}/{totalEpisodes} eps · added {savedItem?.addedDate || drama.addedDate || 'Recently'}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="detail-progress-track">
              <div className="detail-progress-bar" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="detail-progress-info-row">
              <span className="progress-remaining">{drama.remainingTime || `~${Math.max(1, totalEpisodes - watchedCount)}h remaining`}</span>
              <span className="progress-pct-text">{progressPct}%</span>
            </div>

            {/* Status Selector */}
            <div className="detail-sub-section">
              <h3 className="detail-card-heading">STATUS</h3>
              <div className="detail-status-pills">
                {statusOptions.map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`status-option-pill ${status === st ? 'active' : ''}`}
                    onClick={() => handleStatusChange(st)}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* My Rating */}
            <div className="detail-sub-section">
              <h3 className="detail-card-heading">MY RATING</h3>
              <div className="detail-star-picker" onMouseLeave={() => setHoverRating(0)}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((starNum) => {
                  const isFilled = (hoverRating || myRating) >= starNum
                  return (
                    <button
                      key={starNum}
                      type="button"
                      className={`star-pick-button ${isFilled ? 'filled' : ''}`}
                      onClick={() => handleRatingChange(starNum)}
                      onMouseEnter={() => setHoverRating(starNum)}
                      aria-label={`Rate ${starNum} out of 10`}
                    >
                      <Star size={18} fill={isFilled ? '#eb5b78' : 'none'} color={isFilled ? '#eb5b78' : '#3c3748'} />
                    </button>
                  )
                })}
              </div>
              <strong className="detail-rating-score">{myRating} / 10</strong>
            </div>

            {/* My Notes */}
            <div className="detail-sub-section">
              <h3 className="detail-card-heading">MY NOTES</h3>
              <div className="notes-box-wrapper">
                <textarea
                  className="notes-textarea"
                  value={myNotes}
                  onChange={(e) => setMyNotes(e.target.value)}
                  placeholder="Add your personal notes, favorite moments, thoughts..."
                  rows={3}
                />
                <button className="notes-save-button" type="button" onClick={handleSaveNotes}>
                  {noteSaved ? 'Saved ✓' : 'Save'}
                </button>
              </div>
            </div>
          </article>

          {/* Episodes Checklist Card */}
          <article className="detail-card">
            <div className="detail-episodes-header">
              <h3 className="detail-card-heading">EPISODES</h3>
              <span className="episodes-total-label">{totalEpisodes} Total</span>
            </div>

            <div className="episodes-list-group">
              {episodesList.map((ep) => (
                <div
                  key={ep.number}
                  className={`episode-item-row ${ep.watched ? 'watched' : ''}`}
                  onClick={() => toggleEpisode(ep.number)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && toggleEpisode(ep.number)}
                >
                  <span className={`episode-check-circle ${ep.watched ? 'checked' : ''}`}>
                    {ep.watched && <Check size={13} strokeWidth={3} />}
                  </span>
                  <span className="episode-item-title">{ep.title}</span>
                  <span className="episode-item-num">Ep {ep.number}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </div>
  )
}

const DISCOVER_GENRES = [
  { id: null, name: 'All Genres' },
  { id: 10749, name: 'Romance' },
  { id: 18, name: 'Drama' },
  { id: 35, name: 'Comedy' },
  { id: 10759, name: 'Action' },
  { id: 9648, name: 'Mystery' },
  { id: 10765, name: 'Fantasy' },
  { id: 36, name: 'Historical' },
  { id: 27, name: 'Horror' },
  { id: 53, name: 'Thriller' },
  { id: 80, name: 'Crime' },
  { id: 10751, name: 'Family' },
  { id: 16, name: 'Animation' },
]

function DiscoverPage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [selectedDrama, setSelectedDrama] = useState(null)
  const [isAddDramaOpen, setIsAddDramaOpen] = useState(false)
  const [selectedGenre, setSelectedGenre] = useState('All Genres')
  const [genreList, setGenreList] = useState(DISCOVER_GENRES)
  const [gridDramas, setGridDramas] = useState([])
  const [top5List, setTop5List] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const topDrama = top5List[currentSlide] || top5List[0] || null

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDropdownOpen])

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [discRes, genRes] = await Promise.all([
          discoverService.getDiscover({ page: 1 }),
          discoverService.getGenres(),
        ])

        if (discRes?.data && discRes.data.length > 0) {
          const mapped = discRes.data.map((d, index) => mapDramaCard(d, index))
          setTop5List(mapped.slice(0, 5))
          setGridDramas(mapped)
        }

        if (genRes?.data && genRes.data.length > 0) {
          const knownNames = new Set(DISCOVER_GENRES.map((g) => g.name.toLowerCase()))
          const extra = genRes.data
            .filter((g) => !knownNames.has(g.name.toLowerCase()))
            .map((g) => ({ id: g.id, name: g.name }))
          setGenreList([...DISCOVER_GENRES, ...extra])
        }
      } catch {
        // API offline
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handlePrevSlide = () => {
    if (top5List.length === 0) return
    setCurrentSlide((prev) => (prev - 1 + top5List.length) % top5List.length)
  }

  const handleNextSlide = () => {
    if (top5List.length === 0) return
    setCurrentSlide((prev) => (prev + 1) % top5List.length)
  }

  const handleGenreSelect = async (genreObj) => {
    setSelectedGenre(genreObj.name)
    setIsDropdownOpen(false)
    setIsLoading(true)
    try {
      const res = await discoverService.getDiscover({ page: 1, genre_id: genreObj.id || null })
      if (res?.data && res.data.length > 0) {
        const mapped = res.data.map((d, index) => mapDramaCard(d, index))
        setGridDramas(mapped)
      } else {
        setGridDramas([])
      }
    } catch {
      setGridDramas([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDetails = async (drama) => {
    try {
      const tmdbId = drama.tmdb_id || drama.id
      if (tmdbId) {
        const res = await discoverService.getDramaDetails(tmdbId)
        if (res?.data) {
          const detail = mapDramaDetail(res.data)
          setSelectedDrama(detail)
          window.scrollTo({ top: 0, behavior: 'smooth' })
          return
        }
      }
    } catch {
      // API detail fetch failed
    }

    setSelectedDrama(mapDramaDetail(drama))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <DashboardLayout activeTab="discover" onOpenAddDrama={() => setIsAddDramaOpen(true)}>
      {selectedDrama ? (
        <DramaDetailView drama={selectedDrama} onBack={() => setSelectedDrama(null)} />
      ) : (
        <>
          {/* Top 5 Carousel */}
          {topDrama ? (
            <section className="discover-hero" style={{ backgroundImage: `url(${topDrama.image || topDrama.backdrop || DEFAULT_BACKDROP_IMAGE})` }}>
              <button className="discover-back" type="button" onClick={handlePrevSlide} aria-label="Previous drama">
                <ChevronLeft size={22} />
              </button>
              <div className="discover-hero-copy">
                <span>{topDrama.weekHighlight || `#${currentSlide + 1} THIS WEEK`}</span>
                <h1>{topDrama.title}</h1>
                <div>
                  <button className="view-details" type="button" onClick={() => handleOpenDetails(topDrama)}>
                    ▣ &nbsp;View Details
                  </button>
                  <b>★ {topDrama.rating}</b>
                </div>
              </div>
              <button className="discover-next" type="button" onClick={handleNextSlide} aria-label="Next drama">
                <ChevronRight size={22} />
              </button>

              {/* Carousel Slide Indicators */}
              <div className="carousel-dots">
                {top5List.map((d, index) => (
                  <button
                    key={d.id || index}
                    type="button"
                    className={`carousel-dot ${currentSlide === index ? 'active' : ''}`}
                    onClick={() => setCurrentSlide(index)}
                    aria-label={`Go to slide ${index + 1}: ${d.title}`}
                  />
                ))}
              </div>
            </section>
          ) : isLoading ? (
            <section className="discover-hero" style={{ minHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#eb5b78' }} />
            </section>
          ) : null}

          {/* Clean Genre Dropdown Filter */}
          <div className="discover-filter-bar">
            <div className="genre-dropdown-container" ref={dropdownRef}>
              <span className="genre-filter-label" id="genre-filter-label">Genre:</span>
              <div className="genre-dropdown">
                <button
                  id="genre-dropdown-trigger"
                  className={`genre-dropdown-trigger ${isDropdownOpen ? 'open' : ''} ${selectedGenre !== 'All Genres' ? 'active-filter' : ''}`}
                  type="button"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  aria-haspopup="listbox"
                  aria-expanded={isDropdownOpen}
                  aria-labelledby="genre-filter-label genre-dropdown-trigger"
                >
                  <span className="genre-dropdown-text">{selectedGenre}</span>
                  <ChevronDown
                    size={15}
                    className={`genre-chevron-icon ${isDropdownOpen ? 'rotate' : ''}`}
                    aria-hidden="true"
                  />
                </button>

                {isDropdownOpen && (
                  <div className="genre-dropdown-menu" role="listbox" aria-labelledby="genre-filter-label">
                    {genreList.map((g) => {
                      const isSelected = selectedGenre === g.name
                      return (
                        <button
                          key={g.name}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          className={`genre-dropdown-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleGenreSelect(g)}
                        >
                          <span>{g.name}</span>
                          {isSelected && <Check size={14} className="genre-item-check" aria-hidden="true" />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {selectedGenre !== 'All Genres' && (
              <button
                type="button"
                className="genre-clear-btn"
                onClick={() => handleGenreSelect({ id: null, name: 'All Genres' })}
                aria-label="Reset genre filter to All Genres"
              >
                <X size={13} aria-hidden="true" />
                Reset to All
              </button>
            )}
          </div>

          {/* Discover Grid */}
          <section className="discover-grid">
            {isLoading && gridDramas.length === 0 ? (
              <div className="tracker-empty-state" style={{ gridColumn: '1 / -1' }}>
                <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: '#eb5b78' }} />
                <h3>Loading K-Dramas...</h3>
              </div>
            ) : gridDramas.length > 0 ? (
              gridDramas.map((drama) => (
                <div
                  key={drama.id || drama.title}
                  onClick={() => handleOpenDetails(drama)}
                  style={{ cursor: 'pointer' }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleOpenDetails(drama)}
                >
                  <DiscoverCard drama={drama} />
                </div>
              ))
            ) : (
              <div className="tracker-empty-state" style={{ gridColumn: '1 / -1' }}>
                <Film size={36} />
                <h3>No K-Dramas available</h3>
                <p>No dramas found for "{selectedGenre}". Try selecting another genre.</p>
                <button
                  type="button"
                  className="genre-clear-btn"
                  onClick={() => handleGenreSelect({ id: null, name: 'All Genres' })}
                  style={{ marginTop: '12px', padding: '8px 16px', fontSize: '13px' }}
                >
                  Show All Genres
                </button>
              </div>
            )}
          </section>
        </>
      )}

      <AddDramaModal isOpen={isAddDramaOpen} onClose={() => setIsAddDramaOpen(false)} />
    </DashboardLayout>
  )
}

function DiscoverCard({ drama }) {
  return (
    <article className="discover-card">
      <div className="discover-poster" style={{ backgroundImage: `url(${drama.image})` }}>
        <span className={`rank rank-${drama.tone}`}>{drama.rank}</span>
        {drama.status && <b className={`show-status status-${drama.tone}`}>{drama.status}</b>}
      </div>
      <h3>{drama.title}</h3>
      <p>{drama.meta} <strong>★ {drama.rating}</strong></p>
    </article>
  )
}

const FILTER_SLUG_MAP = {
  'all': 'All',
  'favorites': 'Favorites',
  'watching': 'Watching',
  'completed': 'Completed',
  'plan': 'Plan',
  'on-hold': 'On Hold',
  'dropped': 'Dropped',
}

const FILTER_TO_SLUG = {
  'All': 'all',
  'Favorites': 'favorites',
  'Watching': 'watching',
  'Completed': 'completed',
  'Plan': 'plan',
  'On Hold': 'on-hold',
  'Dropped': 'dropped',
}

function TrackerPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { watchlist, stats, updateWatchlist } = useWatchlist()
  const [isAddDramaOpen, setIsAddDramaOpen] = useState(false)
  const [selectedDrama, setSelectedDrama] = useState(null)

  const urlParam = searchParams.get('filter')?.toLowerCase()
  const initialFilter = urlParam && FILTER_SLUG_MAP[urlParam] ? FILTER_SLUG_MAP[urlParam] : 'All'
  const [activeFilter, setActiveFilter] = useState(initialFilter)

  // Sync if URL search params change
  useEffect(() => {
    const filterFromUrl = searchParams.get('filter')?.toLowerCase()
    if (filterFromUrl && FILTER_SLUG_MAP[filterFromUrl]) {
      setActiveFilter(FILTER_SLUG_MAP[filterFromUrl])
    } else if (!filterFromUrl) {
      setActiveFilter('All')
    }
  }, [searchParams])

  const handleFilterClick = (filterKey) => {
    setActiveFilter(filterKey)
    const slug = FILTER_TO_SLUG[filterKey]
    if (slug === 'all') {
      setSearchParams({})
    } else {
      setSearchParams({ filter: slug })
    }
  }

  const handleDramaClick = async (drama) => {
    const tmdbId = drama.tmdb_id || drama.id

    // Immediately render the detail view with the tracked item data and correct poster
    const initialDetail = mapDramaDetail(drama)
    setSelectedDrama(initialDetail)
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // If we have a TMDB ID, fetch full metadata (official TMDB HD poster, backdrop, synopsis, native title, cast)
    if (tmdbId) {
      try {
        const res = await discoverService.getDramaDetails(tmdbId)
        if (res?.data) {
          const fullDetail = mapDramaDetail(res.data)
          setSelectedDrama((prev) => {
            if (!prev) return prev
            const currentSelectedId = prev.tmdb_id || prev.id
            if (String(currentSelectedId) !== String(tmdbId)) return prev

            return {
              ...fullDetail,
              status: drama.status || prev.status,
              myRating: drama.myRating || drama.rating || prev.myRating,
              myNotes: drama.notes || drama.myNotes || prev.myNotes,
              is_favorite: drama.is_favorite ?? prev.is_favorite,
              current_episode: drama.current_episode ?? prev.current_episode,
              watchedCount: drama.watchedCount ?? prev.watchedCount,
            }
          })

          // If the tracked drama was missing its poster or had the fallback, update it in the watchlist
          if (
            (!drama.poster || drama.poster === DEFAULT_POSTER_IMAGE) &&
            res.data.poster_url
          ) {
            updateWatchlist(tmdbId, {
              poster: res.data.poster_url,
              poster_url: res.data.poster_url,
              image: res.data.poster_url,
              backdrop: res.data.backdrop_url || res.data.poster_url,
              backdrop_url: res.data.backdrop_url || res.data.poster_url,
            })
          }
        }
      } catch {
        // Fallback already displayed
      }
    }
  }

  // Filter tabs with dynamic live counts from user's personal watchlist
  const filterTabs = [
    { key: 'All', label: `All (${stats.totalTracked})` },
    { key: 'Favorites', label: `Favorites (${stats.favoritesCount})` },
    { key: 'Watching', label: `Watching (${stats.watchingCount})` },
    { key: 'Completed', label: `Completed (${stats.completedCount})` },
    { key: 'Plan', label: `Plan (${stats.planCount})` },
    { key: 'On Hold', label: `On Hold (${stats.onHoldCount})` },
    { key: 'Dropped', label: `Dropped (${stats.droppedCount})` },
  ]

  const displayedDramas = useMemo(() => {
    return watchlist.filter((drama) => {
      if (activeFilter === 'All') return true
      if (activeFilter === 'Watching') return drama.status === 'Watching'
      if (activeFilter === 'Completed') return drama.status === 'Completed' || drama.status === 'Done'
      if (activeFilter === 'Plan') return drama.status === 'Plan' || drama.status === 'Plan to Watch'
      if (activeFilter === 'On Hold') return drama.status === 'On Hold' || drama.status === 'Paused'
      if (activeFilter === 'Dropped') return drama.status === 'Dropped'
      if (activeFilter === 'Favorites') return !!drama.is_favorite
      return true
    })
  }, [watchlist, activeFilter])

  return (
    <DashboardLayout activeTab="tracker" onOpenAddDrama={() => setIsAddDramaOpen(true)}>
      {selectedDrama ? (
        <DramaDetailView drama={selectedDrama} onBack={() => setSelectedDrama(null)} />
      ) : (
        <>
          <section className="tracker-heading">
            <h1>My Tracker</h1>
            <button className="tracker-add" type="button" onClick={() => setIsAddDramaOpen(true)}>
              <Plus size={15} /> Add Drama
            </button>
          </section>

          <div className="tracker-filters" role="tablist" aria-label="Tracker status filters">
            {filterTabs.map((tab) => (
              <button
                className={activeFilter === tab.key ? 'selected' : ''}
                type="button"
                key={tab.key}
                role="tab"
                aria-selected={activeFilter === tab.key}
                onClick={() => handleFilterClick(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <section className="tracker-list">
            {displayedDramas.length > 0 ? (
              displayedDramas.map((drama) => (
                <div
                  key={drama.id || drama.title}
                  onClick={() => handleDramaClick(drama)}
                  style={{ cursor: 'pointer' }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleDramaClick(drama)}
                >
                  <TrackerRow drama={drama} />
                </div>
              ))
            ) : (
              <div className="tracker-empty-state">
                <Film size={36} />
                <h3>{stats.totalTracked === 0 ? 'Your Tracker is Empty' : `No dramas in "${activeFilter}"`}</h3>
                <p>
                  {stats.totalTracked === 0
                    ? "You haven't added any K-Dramas to your personal tracker yet. Search or explore Discover to start tracking!"
                    : `You don't have any K-dramas marked as ${activeFilter}.`}
                </p>
                <button className="tracker-add" type="button" onClick={() => setIsAddDramaOpen(true)}>
                  <Plus size={15} /> {stats.totalTracked === 0 ? 'Add Your First Drama' : 'Add Drama'}
                </button>
              </div>
            )}
          </section>
        </>
      )}

      <AddDramaModal
        isOpen={isAddDramaOpen}
        onClose={() => setIsAddDramaOpen(false)}
      />
    </DashboardLayout>
  )
}

function TrackerRow({ drama }) {
  return (
    <article className="tracker-row">
      <img src={drama.poster || drama.image || DEFAULT_POSTER_IMAGE} alt={drama.title} />
      <div className="tracker-info">
        <h2>{drama.title}</h2>
        <p>{drama.meta || `${drama.year || '2025'}`}</p>
        <span>{drama.current_episode || drama.watchedCount || 0}/{drama.episodes || 16} eps</span>
        <div className={`tracker-progress progress-${drama.tone || 'blue'}`}>
          <i style={{ width: `${drama.progress || 0}%` }} />
        </div>
        {drama.rating && (
          <b className="tracker-rating">
            ★ {drama.rating} <em>{drama.notes ? `"${drama.notes.slice(0, 30)}..."` : ''}</em>
          </b>
        )}
      </div>
      <strong className={`tracker-status status-${drama.tone || 'blue'}`}>{drama.status}</strong>
      <b className={`tracker-percent percent-${drama.tone || 'blue'}`}>{drama.progress || 0}%</b>
    </article>
  )
}

function ProfilePage() {
  const { user, logout } = useAuth()
  const { stats } = useWatchlist()
  const navigate = useNavigate()
  const [isAddDramaOpen, setIsAddDramaOpen] = useState(false)
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <DashboardLayout activeTab="profile" onOpenAddDrama={() => setIsAddDramaOpen(true)}>
      <section className="profile-summary">
        <img src={user?.avatar || user?.avatar_url || dashboardUser.avatar} alt="" />
        <div>
          <h1>{user?.name || 'Kim Ji-young'}</h1>
          <p>{user?.email || 'kdramaaddict@email.com'}</p>
        </div>
        <button
          type="button"
          aria-label="Edit profile"
          onClick={() => setIsEditProfileOpen(true)}
        >
          <Edit3 size={18} />
        </button>
      </section>
      <section className="profile-stats">
        <div><strong>{stats.totalTracked}</strong><span>Dramas</span></div>
        <div><strong>{stats.totalEpisodesWatched}</strong><span>Episodes</span></div>
        <div><strong>{stats.hoursWatched}h</strong><span>Watched</span></div>
      </section>
      <section className="profile-links">
        <Link to="/tracker"><ClipboardList /> <span><b>My Tracker</b><small>{stats.totalTracked} dramas tracked</small></span><ChevronRight /></Link>
        <Link to="/stats"><BarChart3 /> <span><b>Stats & History</b><small>{stats.totalEpisodesWatched} episodes · {stats.hoursWatched}h</small></span><ChevronRight /></Link>
      </section>
      <button className="signout-button" type="button" onClick={handleLogout}>
        <LogOut size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Sign Out
      </button>
      <AddDramaModal isOpen={isAddDramaOpen} onClose={() => setIsAddDramaOpen(false)} />
      <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} />
    </DashboardLayout>
  )
}

function DashboardLayout({ activeTab, onOpenAddDrama, children }) {
  return (
    <main className="dashboard-page">
      <DashboardHeader activeTab={activeTab} onOpenAddDrama={onOpenAddDrama} />
      <div className="dashboard-content dashboard-subpage">{children}</div>
      <Chatbot />
    </main>
  )
}

function Dashboard() {
  const { user } = useAuth()
  const { stats } = useWatchlist()
  const firstName = user?.name ? user.name.split(' ')[0] : 'Fan'
  const [isAddDramaOpen, setIsAddDramaOpen] = useState(false)
  const [recommendedList, setRecommendedList] = useState([])
  const [selectedDrama, setSelectedDrama] = useState(null)
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(true)

  useEffect(() => {
    async function loadRecommended() {
      setIsLoadingRecommended(true)
      try {
        const res = await discoverService.getDiscover({ page: 1 })
        if (res?.data && res.data.length > 0) {
          const mapped = res.data.slice(0, 4).map((d, index) => mapDramaCard(d, index))
          setRecommendedList(mapped)
        }
      } catch {
        // API offline
      } finally {
        setIsLoadingRecommended(false)
      }
    }
    loadRecommended()
  }, [])

  const handleDramaClick = async (drama) => {
    const tmdbId = drama.tmdb_id || drama.id
    const initialDetail = mapDramaDetail(drama)
    setSelectedDrama(initialDetail)
    window.scrollTo({ top: 0, behavior: 'smooth' })

    if (tmdbId) {
      try {
        const res = await discoverService.getDramaDetails(tmdbId)
        if (res?.data) {
          const fullDetail = mapDramaDetail(res.data)
          setSelectedDrama((prev) => {
            if (!prev) return prev
            const currentSelectedId = prev.tmdb_id || prev.id
            if (String(currentSelectedId) !== String(tmdbId)) return prev

            return {
              ...fullDetail,
              status: drama.status || prev.status,
              myRating: drama.myRating || drama.rating || prev.myRating,
              myNotes: drama.notes || drama.myNotes || prev.myNotes,
              is_favorite: drama.is_favorite ?? prev.is_favorite,
              current_episode: drama.current_episode ?? prev.current_episode,
              watchedCount: drama.watchedCount ?? prev.watchedCount,
            }
          })
        }
      } catch {
        // Fallback already displayed
      }
    }
  }

  // Dynamic user-specific stats
  const dynamicStats = [
    { label: 'Total Tracked', value: stats.totalTracked.toString(), detail: `${stats.watchingCount} watching`, icon: 'bookmark', tone: 'orange' },
    { label: 'Episodes Watched', value: stats.totalEpisodesWatched.toString(), detail: `${stats.completedCount} completed`, icon: 'play', tone: 'cyan' },
    { label: 'Plan to Watch', value: stats.planCount.toString(), detail: `${stats.onHoldCount} on hold`, icon: 'check', tone: 'green' },
    { label: 'Hours Watched', value: `${stats.hoursWatched}h`, detail: 'Total watch time', icon: 'clock', tone: 'purple' },
  ]

  return (
    <main className="dashboard-page">
      <DashboardHeader activeTab="home" onOpenAddDrama={() => setIsAddDramaOpen(true)} />
      <div className="dashboard-content">
        {selectedDrama ? (
          <div className="dashboard-subpage">
            <DramaDetailView drama={selectedDrama} onBack={() => setSelectedDrama(null)} />
          </div>
        ) : (
          <>
            <section className="dashboard-welcome" aria-labelledby="welcome-heading">
              <h1 id="welcome-heading">Annyeong, {firstName}! <span>♡</span></h1>
              <p>무슨 드라마 볼까? <em>What drama should we watch?</em></p>
            </section>

            <section className="dashboard-overview" aria-label="Watchlist overview">
              <div className="stats-grid">
                {dynamicStats.map((stat) => <StatCard stat={stat} key={stat.label} />)}
              </div>
              <CurrentDrama
                onDetailsClick={(drama) => handleDramaClick(drama)}
                onOpenAddDrama={() => setIsAddDramaOpen(true)}
              />
            </section>

            <QuickAccess onOpenAddDrama={() => setIsAddDramaOpen(true)} />

            <section className="dashboard-section recommended-section" aria-labelledby="recommended-heading">
              <h2 id="recommended-heading">Recommended</h2>
              <div className="drama-grid">
                {isLoadingRecommended && recommendedList.length === 0 ? (
                  <div className="tracker-empty-state" style={{ gridColumn: '1 / -1' }}>
                    <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#eb5b78' }} />
                    <p>Loading recommendations...</p>
                  </div>
                ) : (
                  recommendedList.map((drama) => (
                    <div
                      key={drama.id || drama.title}
                      onClick={() => handleDramaClick(drama)}
                      style={{ cursor: 'pointer' }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleDramaClick(drama)}
                    >
                      <DramaCard drama={drama} />
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </div>

      <AddDramaModal
        isOpen={isAddDramaOpen}
        onClose={() => setIsAddDramaOpen(false)}
      />

      <Chatbot />
    </main>
  )
}

export { Chatbot, DashboardHeader, DashboardLayout, DiscoverPage, DramaDetailView, ProfilePage, TrackerPage }
export default Dashboard