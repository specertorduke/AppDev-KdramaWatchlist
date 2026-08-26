import { useState } from 'react'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import Dashboard, { DiscoverPage, ProfilePage, TrackerPage } from './components/Dashboard.jsx'
import './App.css'

const features = [
  {
    icon: '📖',
    title: 'Your personal diary',
    description: 'Log what you watched, write a quick note about how it made you feel.',
  },
  {
    icon: '⭐',
    title: 'Rate & remember',
    description: 'Give each drama a star rating so you can look back on the ones that wrecked you.',
  },
  {
    icon: '📋',
    title: 'Simple lists',
    description: 'Watching, plan to watch, dropped, completed — four clean statuses.',
  },
  {
    icon: '🎬',
    title: 'Episode tracking',
    description: "Mark which episode you're on so you never forget where you left off.",
  },
]

function LandingPage() {
  return (
    <main className="landing-page">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="SarangTV home">SARANGTV</Link>
        <nav className="header-nav" aria-label="Account navigation">
          <Link className="login-link" to="/login">Log In</Link>
          <Link className="button button-primary button-small" to="/signup">Sign Up</Link>
        </nav>
      </header>

      <section className="hero-section">
        <div className="hero-content">
          <h1>Your K-drama <em>diary.</em></h1>
          <p>Track what you watch, rate the ones that hit different, and keep<br className="desktop-break" /> a simple record of your drama life — no fuss.</p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/signup">Sign Up</Link>
            <Link className="button button-outline" to="/login">Log In</Link>
          </div>
        </div>
      </section>

      <section className="features-section" aria-labelledby="features-heading">
        <h2 id="features-heading">Simple by design</h2>
        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.title}>
              <span className="feature-icon" aria-hidden="true">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <p>Your dramas, your list, your pace.</p>
        <Link className="button button-primary" to="/signup">Create your watchlist</Link>
      </section>

      <footer className="site-footer">
        <Link className="brand" to="/" aria-label="SarangTV home">SARANGTV</Link>
        <p>© 2026 SarangTV — made for K-drama fans.</p>
      </footer>

      <button className="help-button" type="button" aria-label="Help">?</button>
    </main>
  )
}

function AuthPage({ mode }) {
  const isSignup = mode === 'signup'
  const [showPassword, setShowPassword] = useState(false)

  return (
    <main className="auth-page">
      <div className="auth-container">
        <Link className="back-link" to="/">
          <ArrowLeft size={14} strokeWidth={1.8} aria-hidden="true" />
          Back
        </Link>

        <Link className="auth-brand" to="/" aria-label="SarangTV home">SARANGTV</Link>

        <div className="auth-heading">
          <h1>{isSignup ? 'Start your watchlist' : 'Welcome back'}</h1>
          <p>{isSignup ? 'Create an account to begin tracking.' : 'Log in to your watchlist.'}</p>
        </div>

        <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
          {isSignup && (
            <label className="auth-field">
              <span>Name</span>
              <input name="name" type="text" placeholder="DramaFan2026" />
            </label>
          )}

          <label className="auth-field">
            <span>Email</span>
            <input name="email" type="email" placeholder="you@example.com" />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <span className="password-input">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={isSignup ? 'Min. 8 characters' : '••••••••'}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </span>
          </label>

          {!isSignup && <Link className="forgot-link" to="/forgot-password">Forgot password?</Link>}

          <button className="auth-submit" type="submit">{isSignup ? 'Create Account' : 'Log In'}</button>

          <p className="auth-switch">
            {isSignup ? 'Already have an account?' : 'No account?'}{' '}
            <Link to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Log in' : 'Sign up'}</Link>
          </p>
        </form>
      </div>

      <button className="help-button" type="button" aria-label="Help">?</button>
    </main>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/tracker" element={<TrackerPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
