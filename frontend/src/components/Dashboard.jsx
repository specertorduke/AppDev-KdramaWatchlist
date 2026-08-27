import {
  Bookmark,
  Check,
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
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
} from '../data/dashboardData.js'

const statIcons = { bookmark: Bookmark, play: Play, check: Check, clock: Clock3 }
const quickIcons = { clipboard: ClipboardList, plus: Plus, pause: Pause, send: Send }

function DashboardHeader({ activeTab }) {
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
        <button type="button" aria-label="Search"><Search size={20} /></button>
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

function CurrentDrama() {
  return (
    <article className="current-drama">
      <div className="current-drama-image" style={{ backgroundImage: `url(${currentDrama.image})` }} />
      <div className="current-drama-content">
        <div className="watching-label"><i /> Watching progress</div>
        <div className="current-show-row">
          <img className="current-avatar" src={currentDrama.avatar} alt="" />
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

function QuickAccess() {
  return (
    <section className="dashboard-section quick-section" aria-labelledby="quick-heading">
      <h2 id="quick-heading">Quick access</h2>
      <div className="quick-grid">
        {quickAccess.map((item) => {
          const Icon = quickIcons[item.icon]
          return <button className={`quick-card quick-${item.tone}`} type="button" key={item.label}>
            <span><Icon size={22} /></span>{item.label}<ChevronRight size={17} />
          </button>
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

function DiscoverPage() {
  return <DashboardLayout activeTab="discover">
    <section className="discover-hero" style={{ backgroundImage: `url(${currentDrama.image})` }}>
      <div className="discover-back" aria-hidden="true">‹</div>
      <div className="discover-hero-copy"><span>#1 THIS WEEK</span><h1>Midnight in Seoul</h1><div><button className="view-details" type="button">▣ &nbsp;View Details</button><b>★ 9.4</b></div></div>
      <div className="discover-next" aria-hidden="true">›</div>
    </section>
    <div className="genre-list">{discoverGenres.map((genre, index) => <button className={index === 0 ? 'selected' : ''} type="button" key={genre}>{genre}</button>)}</div>
    <section className="discover-grid">{discoverDramas.map((drama) => <DiscoverCard drama={drama} key={drama.title} />)}</section>
  </DashboardLayout>
}

function DiscoverCard({ drama }) {
  return <article className="discover-card"><div className="discover-poster" style={{ backgroundImage: `url(${drama.image})` }}><span className={`rank rank-${drama.tone}`}>{drama.rank}</span>{drama.status && <b className={`show-status status-${drama.tone}`}>{drama.status}</b>}</div><h3>{drama.title}</h3><p>{drama.meta} <strong>★ {drama.rating}</strong></p></article>
}

function TrackerPage() {
  return <DashboardLayout activeTab="tracker"><section className="tracker-heading"><h1>My Tracker</h1><button className="tracker-add" type="button"><Plus size={15} /> Add Drama</button></section><div className="tracker-filters">{['All (4)', 'Favorites (0)', 'Watching (1)', 'Completed (1)', 'Plan (1)', 'On Hold (1)', 'Dropped (0)'].map((filter, index) => <button className={index === 0 ? 'selected' : ''} type="button" key={filter}>{filter}</button>)}</div><section className="tracker-list">{trackerDramas.map((drama) => <TrackerRow drama={drama} key={drama.title} />)}</section></DashboardLayout>
}

function TrackerRow({ drama }) {
  return <article className="tracker-row"><img src={drama.image} alt="" /><div className="tracker-info"><h2>{drama.title}</h2><p>{drama.meta}</p><span>{drama.episodes}</span><div className={`tracker-progress progress-${drama.tone}`}><i style={{ width: `${drama.progress}%` }} /></div>{drama.rating && <b className="tracker-rating">★ {drama.rating} <em>{drama.note}</em></b>}</div><strong className={`tracker-status status-${drama.tone}`}>{drama.status}</strong><b className={`tracker-percent percent-${drama.tone}`}>{drama.progress}%</b></article>
}

function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return <DashboardLayout activeTab="profile">
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
  </DashboardLayout>
}

function DashboardLayout({ activeTab, children }) {
  return <main className="dashboard-page"><DashboardHeader activeTab={activeTab} /><div className="dashboard-content dashboard-subpage">{children}</div><button className="help-button" type="button" aria-label="Help">?</button></main>
}

function Dashboard() {
  const { user } = useAuth()
  const firstName = user?.name ? user.name.split(' ')[0] : dashboardUser.name

  return (
    <main className="dashboard-page">
      <DashboardHeader activeTab="home" />
      <div className="dashboard-content">
        <section className="dashboard-welcome" aria-labelledby="welcome-heading">
          <h1 id="welcome-heading">Annyeong, {firstName}! <span>♡</span></h1>
          <p>무슨 드라마 볼까? <em>What drama should we watch?</em></p>
        </section>

        <section className="dashboard-overview" aria-label="Watchlist overview">
          <div className="stats-grid">{dashboardStats.map((stat) => <StatCard stat={stat} key={stat.label} />)}</div>
          <CurrentDrama />
        </section>

        <QuickAccess />

        <section className="dashboard-section recommended-section" aria-labelledby="recommended-heading">
          <h2 id="recommended-heading">Recommended</h2>
          <div className="drama-grid">{recommendedDramas.map((drama) => <DramaCard drama={drama} key={drama.title} />)}</div>
        </section>
      </div>
      <button className="help-button" type="button" aria-label="Help">?</button>
    </main>
  )
}

export { DiscoverPage, ProfilePage, TrackerPage }
export default Dashboard