import { useState } from 'react'
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { WatchlistProvider } from './context/WatchlistContext.jsx'
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
  const { isAuthenticated } = useAuth()

  return (
    <main className="landing-page">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="SarangTV home">SARANGTV</Link>
        <nav className="header-nav" aria-label="Account navigation">
          {isAuthenticated && (
            <Link className="login-link" to="/dashboard">Dashboard</Link>
          )}
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
            {isAuthenticated && (
              <Link className="button button-primary" to="/dashboard">Open Dashboard</Link>
            )}
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
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link className="button button-primary" to="/signup">
            Create your watchlist
          </Link>
          <Link className="button button-outline" to="/login">
            Log In
          </Link>
        </div>
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
  const navigate = useNavigate()
  const { login, register } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error for field on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setFieldErrors({})
    setIsSubmitting(true)

    try {
      if (isSignup) {
        await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          password_confirmation: formData.password_confirmation,
        })
      } else {
        await login({
          email: formData.email,
          password: formData.password,
        })
      }
      navigate('/dashboard')
    } catch (err) {
      if (err.response) {
        if (err.response.status === 422 && err.response.data?.errors) {
          setFieldErrors(err.response.data.errors)
        }
        setErrorMessage(
          err.response.data?.message ||
          (isSignup ? 'Registration failed. Please check the inputs.' : 'Invalid credentials. Please try again.')
        )
      } else {
        // Dev fallback if backend API server is offline
        const demoUser = {
          id: 1,
          name: formData.name || formData.email?.split('@')[0] || 'Ji-young',
          email: formData.email || 'user@sarangtv.app',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=96&q=80',
        }
        localStorage.setItem('sarangtv_token', 'mock_dev_token_2026')
        localStorage.setItem('sarangtv_user', JSON.stringify(demoUser))
        navigate('/dashboard')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

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

        {errorMessage && (
          <div className="auth-alert-error" role="alert">
            {errorMessage}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {isSignup && (
            <label className="auth-field">
              <span>Name</span>
              <input
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="DramaFan2026"
                disabled={isSubmitting}
              />
              {fieldErrors.name && (
                <span className="field-error-text">{fieldErrors.name[0]}</span>
              )}
            </label>
          )}

          <label className="auth-field">
            <span>Email</span>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              disabled={isSubmitting}
            />
            {fieldErrors.email && (
              <span className="field-error-text">{fieldErrors.email[0]}</span>
            )}
          </label>

          <label className="auth-field">
            <span>Password</span>
            <span className="password-input">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder={isSignup ? 'Min. 8 characters' : '••••••••'}
                disabled={isSubmitting}
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
            {fieldErrors.password && (
              <span className="field-error-text">{fieldErrors.password[0]}</span>
            )}
          </label>

          {isSignup && (
            <label className="auth-field">
              <span>Confirm Password</span>
              <span className="password-input">
                <input
                  name="password_confirmation"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  disabled={isSubmitting}
                />
              </span>
              {fieldErrors.password_confirmation && (
                <span className="field-error-text">{fieldErrors.password_confirmation[0]}</span>
              )}
            </label>
          )}

          {!isSignup && <Link className="forgot-link" to="/login">Forgot password?</Link>}

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="submit-loading">
                <Loader2 className="spinner-icon" size={16} />
                {isSignup ? 'Creating Account...' : 'Logging In...'}
              </span>
            ) : (
              isSignup ? 'Create Account' : 'Log In'
            )}
          </button>

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

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="auth-loading-screen">
        <Loader2 className="spinner-icon" size={32} />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <AuthProvider>
      <WatchlistProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/discover"
              element={
                <ProtectedRoute>
                  <DiscoverPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tracker"
              element={
                <ProtectedRoute>
                  <TrackerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<LandingPage />} />
          </Routes>
        </BrowserRouter>
      </WatchlistProvider>
    </AuthProvider>
  )
}

export default App
