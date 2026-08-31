import {
  Bookmark,
  Check,
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
  Settings,
  Send,
  LogOut,
  X,
  Sparkles,
  Film,
  Star,
  CheckCircle2,
  Heart,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import {
  currentDrama,
  dashboardStats,
  dashboardUser,
  quickAccess,
  recommendedDramas,
  discoverDramas,
  discoverGenres,
  trackerDramas,
  searchableDramas,
  top5Dramas,
} from '../data/dashboardData.js'

const statIcons = { bookmark: Bookmark, play: Play, check: Check, clock: Clock3 }
const quickIcons = { clipboard: ClipboardList, plus: Plus, pause: Pause, send: Send }

const searchGenres = ['All', 'Trending', 'Romance', 'Action', 'Thriller', 'Fantasy', 'Comedy', 'Drama', 'Historical']

function AddDramaModal({ isOpen, onClose, onDramaAdded }) {
  const [query, setQuery] = useState('')
  const [activeGenre, setActiveGenre] = useState('All')
  const [addedIds, setAddedIds] = useState({})
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Reset search when opened
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

  const filteredDramas = useMemo(() => {
    return searchableDramas.filter((drama) => {
      const matchesGenre =
        activeGenre === 'All'
          ? true
          : activeGenre === 'Trending'
          ? drama.rating >= 9.2
          : drama.genres.some((g) => g.toLowerCase() === activeGenre.toLowerCase())

      const q = query.trim().toLowerCase()
      const matchesQuery =
        !q ||
        drama.title.toLowerCase().includes(q) ||
        drama.cast?.toLowerCase().includes(q) ||
        drama.synopsis?.toLowerCase().includes(q) ||
        drama.genres.some((g) => g.toLowerCase().includes(q))

      return matchesGenre && matchesQuery
    })
  }, [query, activeGenre])

  const handleAdd = (drama) => {
    setAddedIds((prev) => ({ ...prev, [drama.id]: true }))
    setToastMessage(`"${drama.title}" added to your Plan to Watch list!`)
    onDramaAdded?.(drama)

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
            <p>Search K-dramas across all genres and quickly add them to your tracker.</p>
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
              placeholder="Search by title, genre, actor (e.g. Queen of Tears, Goblin)..."
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

        {/* Genre Tabs */}
        <div className="modal-genre-tabs" role="tablist" aria-label="Filter dramas by genre">
          {searchGenres.map((genre) => (
            <button
              key={genre}
              type="button"
              role="tab"
              aria-selected={activeGenre === genre}
              className={`modal-genre-tab ${activeGenre === genre ? 'active' : ''}`}
              onClick={() => setActiveGenre(genre)}
            >
              {genre}
            </button>
          ))}
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
            <span>{filteredDramas.length} {filteredDramas.length === 1 ? 'drama' : 'dramas'} available</span>
          </div>

          {filteredDramas.length > 0 ? (
            <div className="modal-results-grid">
              {filteredDramas.map((drama) => {
                const isAdded = !!addedIds[drama.id]
                return (
                  <article className="modal-drama-card" key={drama.id}>
                    <div className="modal-drama-poster" style={{ backgroundImage: `url(${drama.image})` }}>
                      <span className="modal-rating-badge">★ {drama.rating}</span>
                    </div>

                    <div className="modal-drama-info">
                      <div className="modal-drama-top">
                        <h3>{drama.title}</h3>
                        <span className="modal-drama-meta">
                          {drama.year} · {drama.episodes} eps
                        </span>
                      </div>

                      <div className="modal-drama-tags">
                        {drama.genres.slice(0, 3).map((g) => (
                          <span className="genre-pill" key={g}>{g}</span>
                        ))}
                      </div>

                      <p className="modal-drama-synopsis">{drama.synopsis}</p>

                      <div className="modal-drama-bottom">
                        <small className="modal-drama-cast">Cast: {drama.cast}</small>
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
              <p>We couldn't find any K-dramas matching "{query}". Try a different title or genre!</p>
              <button
                type="button"
                className="button button-outline button-small"
                onClick={() => {
                  setQuery('')
                  setActiveGenre('All')
                }}
              >
                Reset filters
              </button>
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
      <Link to="/profile" onClick={onClose}>Stats</Link>
      <Link to="/profile" onClick={onClose}>Profile</Link>
      <Link to="/profile" onClick={onClose}>Settings</Link>
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

function CurrentDrama() {
  return (
    <article className="current-drama">
      <div className="current-drama-image" style={{ backgroundImage: `url(${currentDrama.image})` }} />
      <div className="current-drama-content">
        <div className="watching-label"><i /> Watching progress</div>
        <div className="current-show-row">
          <CircularProgressAvatar
            src={currentDrama.avatar}
            progress={currentDrama.progress}
            size={68}
            strokeWidth={4.5}
          />
          <div>
            <h3>{currentDrama.title}</h3>
            <p>{currentDrama.episode} · {currentDrama.runtime}</p>
            <div className="progress-row">
              <div className="progress-bar"><span style={{ width: `${currentDrama.progress}%` }} /></div>
              <b>{currentDrama.progress}%</b>
            </div>
          </div>
        </div>
        <div className="current-drama-footer">
          <span>Logged<strong>{currentDrama.logged}</strong></span>
          <div>
            <button className="detail-button" type="button">Details</button>
            <button className="log-button" type="button"><Check size={15} /> Log Ep 4</button>
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
  const [status, setStatus] = useState(drama.status || 'Watching')
  const [myRating, setMyRating] = useState(drama.myRating || 9)
  const [hoverRating, setHoverRating] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [myNotes, setMyNotes] = useState(drama.myNotes || '')
  const [noteSaved, setNoteSaved] = useState(false)
  const [episodesList, setEpisodesList] = useState(
    drama.episodeList || [
      { number: 1, title: 'The First Meeting', watched: true },
      { number: 2, title: 'Shattered Glass', watched: true },
      { number: 3, title: 'The Red Thread', watched: true },
      { number: 4, title: 'Promises at Dawn', watched: false },
    ]
  )

  const watchedCount = episodesList.filter((ep) => ep.watched).length
  const totalEpisodes = drama.episodes || episodesList.length || 16
  const progressPct = totalEpisodes > 0 ? Math.round((watchedCount / totalEpisodes) * 100) : 0

  const toggleEpisode = (epNum) => {
    setEpisodesList((prev) =>
      prev.map((ep) => (ep.number === epNum ? { ...ep, watched: !ep.watched } : ep))
    )
  }

  const handleSaveNotes = () => {
    setNoteSaved(true)
    setTimeout(() => setNoteSaved(false), 2200)
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
            src={drama.poster || drama.image}
            alt={drama.title}
          />
        </div>

        <div className="detail-header-info">
          <div className="detail-badges-row">
            <span className="detail-badge-rank">{drama.rankBadge || `TOP ${drama.rank || 1}`}</span>
            <span className="detail-badge-status">{status}</span>
          </div>

          <h1 className="detail-main-title">{drama.title}</h1>
          {drama.nativeTitle && <p className="detail-native-title">{drama.nativeTitle}</p>}

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
            <button className="detail-update-status-button" type="button">
              <Plus size={16} /> Update Status
            </button>
            <button
              className={`detail-heart-button ${isFavorite ? 'active' : ''}`}
              type="button"
              onClick={() => setIsFavorite((prev) => !prev)}
              aria-label="Add to favorites"
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
                {watchedCount}/{totalEpisodes} eps · added {drama.addedDate || 'Jul 12, 2025'}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="detail-progress-track">
              <div className="detail-progress-bar" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="detail-progress-info-row">
              <span className="progress-remaining">{drama.remainingTime || '~14h remaining'}</span>
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
                    onClick={() => setStatus(st)}
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
                      onClick={() => setMyRating(starNum)}
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

function DiscoverPage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [selectedDrama, setSelectedDrama] = useState(null)
  const [isAddDramaOpen, setIsAddDramaOpen] = useState(false)
  const [selectedGenre, setSelectedGenre] = useState('All')

  const topDrama = top5Dramas[currentSlide]

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + top5Dramas.length) % top5Dramas.length)
  }

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % top5Dramas.length)
  }

  const handleOpenDetails = (drama) => {
    const fullDrama =
      top5Dramas.find((d) => d.id === drama.id || d.title.toLowerCase() === drama.title.toLowerCase()) || drama
    setSelectedDrama(fullDrama)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <DashboardLayout activeTab="discover" onOpenAddDrama={() => setIsAddDramaOpen(true)}>
      {selectedDrama ? (
        <DramaDetailView drama={selectedDrama} onBack={() => setSelectedDrama(null)} />
      ) : (
        <>
          {/* Top 5 Carousel */}
          <section className="discover-hero" style={{ backgroundImage: `url(${topDrama.image})` }}>
            <button className="discover-back" type="button" onClick={handlePrevSlide} aria-label="Previous drama">
              ‹
            </button>
            <div className="discover-hero-copy">
              <span>{topDrama.weekHighlight}</span>
              <h1>{topDrama.title}</h1>
              <div>
                <button className="view-details" type="button" onClick={() => handleOpenDetails(topDrama)}>
                  ▣ &nbsp;View Details
                </button>
                <b>★ {topDrama.rating}</b>
              </div>
            </div>
            <button className="discover-next" type="button" onClick={handleNextSlide} aria-label="Next drama">
              ›
            </button>

            {/* Carousel Slide Indicators */}
            <div className="carousel-dots">
              {top5Dramas.map((d, index) => (
                <button
                  key={d.id}
                  type="button"
                  className={`carousel-dot ${currentSlide === index ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Go to slide ${index + 1}: ${d.title}`}
                />
              ))}
            </div>
          </section>

          {/* Genre Filters */}
          <div className="genre-list" role="tablist">
            {discoverGenres.map((genre) => (
              <button
                className={selectedGenre === genre ? 'selected' : ''}
                type="button"
                key={genre}
                onClick={() => setSelectedGenre(genre)}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* Discover Grid */}
          <section className="discover-grid">
            {discoverDramas.map((drama) => (
              <div
                key={drama.title}
                onClick={() => handleOpenDetails(drama)}
                style={{ cursor: 'pointer' }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleOpenDetails(drama)}
              >
                <DiscoverCard drama={drama} />
              </div>
            ))}
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
  const [trackerList, setTrackerList] = useState(trackerDramas)
  const [isAddDramaOpen, setIsAddDramaOpen] = useState(false)

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

  const handleDramaAdded = (newDrama) => {
    // Add to user's tracker list under "Plan" status if not already added
    setTrackerList((prev) => {
      if (prev.some((d) => d.title.toLowerCase() === newDrama.title.toLowerCase())) {
        return prev
      }
      const newEntry = {
        id: Date.now(),
        title: newDrama.title,
        meta: `${newDrama.genres.slice(0, 2).join(' · ')}`,
        episodes: `0/${newDrama.episodes} eps`,
        progress: 0,
        status: 'Plan',
        tone: 'purple',
        image: newDrama.image,
      }
      return [newEntry, ...prev]
    })
  }

  // Filter tabs with dynamic counts
  const filterTabs = [
    { key: 'All', label: `All (${trackerList.length})` },
    { key: 'Favorites', label: `Favorites (0)` },
    { key: 'Watching', label: `Watching (${trackerList.filter((d) => d.status === 'Watching').length})` },
    { key: 'Completed', label: `Completed (${trackerList.filter((d) => d.status === 'Completed' || d.status === 'Done').length})` },
    { key: 'Plan', label: `Plan (${trackerList.filter((d) => d.status === 'Plan').length})` },
    { key: 'On Hold', label: `On Hold (${trackerList.filter((d) => d.status === 'On Hold' || d.status === 'Paused').length})` },
    { key: 'Dropped', label: `Dropped (${trackerList.filter((d) => d.status === 'Dropped').length})` },
  ]

  const displayedDramas = trackerList.filter((drama) => {
    if (activeFilter === 'All') return true
    if (activeFilter === 'Watching') return drama.status === 'Watching'
    if (activeFilter === 'Completed') return drama.status === 'Completed' || drama.status === 'Done'
    if (activeFilter === 'Plan') return drama.status === 'Plan'
    if (activeFilter === 'On Hold') return drama.status === 'On Hold' || drama.status === 'Paused'
    if (activeFilter === 'Dropped') return drama.status === 'Dropped'
    if (activeFilter === 'Favorites') return false
    return true
  })

  return (
    <DashboardLayout activeTab="tracker" onOpenAddDrama={() => setIsAddDramaOpen(true)}>
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
          displayedDramas.map((drama) => <TrackerRow drama={drama} key={drama.id || drama.title} />)
        ) : (
          <div className="tracker-empty-state">
            <Film size={36} />
            <h3>No dramas in "{activeFilter}"</h3>
            <p>You don't have any K-dramas with this status yet.</p>
            <button className="tracker-add" type="button" onClick={() => setIsAddDramaOpen(true)}>
              <Plus size={15} /> Add a Drama
            </button>
          </div>
        )}
      </section>

      <AddDramaModal
        isOpen={isAddDramaOpen}
        onClose={() => setIsAddDramaOpen(false)}
        onDramaAdded={handleDramaAdded}
      />
    </DashboardLayout>
  )
}

function TrackerRow({ drama }) {
  return (
    <article className="tracker-row">
      <img src={drama.image} alt={drama.title} />
      <div className="tracker-info">
        <h2>{drama.title}</h2>
        <p>{drama.meta}</p>
        <span>{drama.episodes}</span>
        <div className={`tracker-progress progress-${drama.tone}`}>
          <i style={{ width: `${drama.progress}%` }} />
        </div>
        {drama.rating && (
          <b className="tracker-rating">
            ★ {drama.rating} <em>{drama.note}</em>
          </b>
        )}
      </div>
      <strong className={`tracker-status status-${drama.tone}`}>{drama.status}</strong>
      <b className={`tracker-percent percent-${drama.tone}`}>{drama.progress}%</b>
    </article>
  )
}

function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isAddDramaOpen, setIsAddDramaOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <DashboardLayout activeTab="profile" onOpenAddDrama={() => setIsAddDramaOpen(true)}>
      <section className="profile-summary">
        <img src={dashboardUser.avatar} alt="" />
        <div>
          <h1>{user?.name || 'Kim Ji-young'}</h1>
          <p>{user?.email || 'kdramaaddict@email.com'}</p>
        </div>
        <button type="button" aria-label="Edit profile"><Edit3 size={18} /></button>
      </section>
      <section className="profile-stats">
        <div><strong>4</strong><span>Dramas</span></div>
        <div><strong>18</strong><span>Episodes</span></div>
        <div><strong>17h</strong><span>Watched</span></div>
      </section>
      <section className="profile-links">
        <Link to="/tracker"><ClipboardList /> <span><b>My Tracker</b><small>4 dramas tracked</small></span><ChevronRight /></Link>
        <Link to="/profile"><BarChart3 /> <span><b>Stats & History</b><small>18 episodes · 17h</small></span><ChevronRight /></Link>
        <Link to="/profile"><Settings /> <span><b>Settings</b><small>Notifications, quality, account</small></span><ChevronRight /></Link>
      </section>
      <button className="signout-button" type="button" onClick={handleLogout}>
        <LogOut size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Sign Out
      </button>
      <AddDramaModal isOpen={isAddDramaOpen} onClose={() => setIsAddDramaOpen(false)} />
    </DashboardLayout>
  )
}

function DashboardLayout({ activeTab, onOpenAddDrama, children }) {
  return (
    <main className="dashboard-page">
      <DashboardHeader activeTab={activeTab} onOpenAddDrama={onOpenAddDrama} />
      <div className="dashboard-content dashboard-subpage">{children}</div>
      <button className="help-button" type="button" aria-label="Help">?</button>
    </main>
  )
}

function Dashboard() {
  const { user } = useAuth()
  const firstName = user?.name ? user.name.split(' ')[0] : dashboardUser.name
  const [isAddDramaOpen, setIsAddDramaOpen] = useState(false)

  return (
    <main className="dashboard-page">
      <DashboardHeader activeTab="home" onOpenAddDrama={() => setIsAddDramaOpen(true)} />
      <div className="dashboard-content">
        <section className="dashboard-welcome" aria-labelledby="welcome-heading">
          <h1 id="welcome-heading">Annyeong, {firstName}! <span>♡</span></h1>
          <p>무슨 드라마 볼까? <em>What drama should we watch?</em></p>
        </section>

        <section className="dashboard-overview" aria-label="Watchlist overview">
          <div className="stats-grid">
            {dashboardStats.map((stat) => <StatCard stat={stat} key={stat.label} />)}
          </div>
          <CurrentDrama />
        </section>

        <QuickAccess onOpenAddDrama={() => setIsAddDramaOpen(true)} />

        <section className="dashboard-section recommended-section" aria-labelledby="recommended-heading">
          <h2 id="recommended-heading">Recommended</h2>
          <div className="drama-grid">
            {recommendedDramas.map((drama) => <DramaCard drama={drama} key={drama.title} />)}
          </div>
        </section>
      </div>

      <AddDramaModal
        isOpen={isAddDramaOpen}
        onClose={() => setIsAddDramaOpen(false)}
      />

      <button className="help-button" type="button" aria-label="Help">?</button>
    </main>
  )
}

export { DiscoverPage, ProfilePage, TrackerPage }
export default Dashboard