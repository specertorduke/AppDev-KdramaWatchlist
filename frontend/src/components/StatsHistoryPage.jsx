import { useState } from 'react'
import {
  Bookmark,
  Check,
  ChevronLeft,
  Clock3,
  Play,
  Star,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useWatchlist } from '../context/WatchlistContext.jsx'
import { DashboardHeader, DramaDetailView } from './Dashboard.jsx'
import Chatbot from './Chatbot.jsx'

export default function StatsHistoryPage() {
  const navigate = useNavigate()
  const { stats, history, watchlist } = useWatchlist()
  const [selectedDrama, setSelectedDrama] = useState(null)
  const [isAddDramaOpen, setIsAddDramaOpen] = useState(false)

  // Star rating calculation: 10 stars
  const ratingNum = parseFloat(stats.avgRating) || 0
  const filledStarsCount = Math.round(ratingNum)

  return (
    <main className="dashboard-page">
      <DashboardHeader activeTab="profile" onOpenAddDrama={() => setIsAddDramaOpen(true)} />

      <div className="dashboard-content dashboard-subpage">
        {selectedDrama ? (
          <DramaDetailView drama={selectedDrama} onBack={() => setSelectedDrama(null)} />
        ) : (
          <div className="stats-page-container">
            {/* Back Button */}
            <div className="stats-page-top">
              <button
                className="stats-back-button"
                type="button"
                onClick={() => navigate('/profile')}
                aria-label="Back to Profile"
              >
                <ChevronLeft size={18} />
                <span>Back to Profile</span>
              </button>
            </div>

            {/* Page Title */}
            <h1 className="stats-page-title">My Stats</h1>

            {/* 2x2 Stats Summary Grid */}
            <div className="stats-summary-grid">
              {/* Total Dramas */}
              <div className="stat-metric-card">
                <div className="stat-icon-badge stat-badge-purple">
                  <Bookmark size={18} />
                </div>
                <div className="stat-big-number">{stats.totalTracked}</div>
                <div className="stat-card-label">Total Dramas</div>
                <div className="stat-card-sublabel">in your list</div>
              </div>

              {/* Episodes Watched */}
              <div className="stat-metric-card">
                <div className="stat-icon-badge stat-badge-blue">
                  <Play size={18} />
                </div>
                <div className="stat-big-number">{stats.totalEpisodesWatched}</div>
                <div className="stat-card-label">Episodes Watched</div>
                <div className="stat-card-sublabel">episodes done</div>
              </div>

              {/* Hours Watched */}
              <div className="stat-metric-card">
                <div className="stat-icon-badge stat-badge-amber">
                  <Clock3 size={18} />
                </div>
                <div className="stat-big-number">{stats.hoursWatched}h</div>
                <div className="stat-card-label">Hours Watched</div>
                <div className="stat-card-sublabel">time well spent</div>
              </div>

              {/* Completed */}
              <div className="stat-metric-card">
                <div className="stat-icon-badge stat-badge-green">
                  <Check size={18} />
                </div>
                <div className="stat-big-number">{stats.completedCount}</div>
                <div className="stat-card-label">Completed</div>
                <div className="stat-card-sublabel">{stats.watchingCount} watching</div>
              </div>
            </div>

            {/* Average Rating Card */}
            <div className="stat-rating-card">
              <div className="stat-rating-header">
                <span className="stat-rating-number">{stats.avgRating}</span>
                <div className="stat-rating-stars" aria-label={`Average rating ${stats.avgRating} out of 10`}>
                  {Array.from({ length: 10 }, (_, index) => {
                    const isFilled = index < filledStarsCount
                    return (
                      <Star
                        key={index}
                        size={16}
                        className={isFilled ? 'star-filled' : 'star-empty'}
                      />
                    )
                  })}
                </div>
              </div>
              <div className="stat-rating-label">Avg. rating</div>
            </div>

            {/* Status Breakdown Card */}
            <div className="stat-breakdown-card">
              <h2 className="stat-section-title">STATUS BREAKDOWN</h2>
              <div className="stat-breakdown-list">
                {stats.statusBreakdown.map((item) => (
                  <div className="stat-breakdown-row" key={item.label}>
                    <div className="stat-breakdown-info">
                      <span className={`stat-status-name stat-status-${item.tone}`}>
                        {item.label}
                      </span>
                      <span className="stat-status-count">{item.count}</span>
                    </div>
                    <div className="stat-bar-track">
                      <div
                        className={`stat-bar-fill stat-bar-${item.tone}`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Favourite Genres Card */}
            <div className="stat-genres-card">
              <h2 className="stat-section-title">FAVOURITE GENRES</h2>
              {stats.favouriteGenres.length > 0 ? (
                <div className="stat-genres-list">
                  {stats.favouriteGenres.map((genre) => (
                    <div className="stat-genre-row" key={genre.name}>
                      <div className="stat-genre-info">
                        <span className="stat-genre-name">{genre.name}</span>
                        <span className="stat-genre-count">
                          {genre.count} {genre.count === 1 ? 'drama' : 'dramas'}
                        </span>
                      </div>
                      <div className="stat-bar-track">
                        <div
                          className="stat-bar-fill stat-bar-genre"
                          style={{ width: `${genre.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="stat-empty-notice">
                  <p>No genre data yet. Add dramas to your watchlist to see your favourite genres!</p>
                </div>
              )}
            </div>

            {/* User Activity History Section */}
            <div className="stat-history-card">
              <h2 className="stat-section-title">ACTIVITY HISTORY</h2>
              {history.length > 0 ? (
                <div className="stats-history-list">
                  {history.map((item) => (
                    <div
                      className="stats-history-item"
                      key={item.id}
                      onClick={() => {
                        const matched = watchlist.find(
                          (d) => (d.tmdb_id || d.id) === (item.dramaId || item.id)
                        )
                        if (matched) setSelectedDrama(matched)
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      {item.poster && (
                        <img
                          src={item.poster}
                          alt={item.title || 'Drama'}
                          className="stats-history-thumb"
                        />
                      )}
                      <div className="stats-history-details">
                        <strong className="stats-history-drama-title">
                          {item.title}
                        </strong>
                        <span className="stats-history-action">
                          {item.action || `Status: ${item.status}`}
                        </span>
                      </div>
                      <span className="stats-history-date">
                        {item.dateStr || 'Recently'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="stats-history-empty">
                  <Clock3 size={42} className="stats-empty-icon" />
                  <h3>No history yet</h3>
                  <p>Your watch activity will appear here once you start tracking dramas.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <Chatbot />
    </main>
  )
}

