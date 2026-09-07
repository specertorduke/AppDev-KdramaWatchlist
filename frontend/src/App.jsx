import { useState } from 'react'
import { ArrowLeft, Eye, EyeOff, FileText, Loader2, ShieldCheck, X } from 'lucide-react'
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { WatchlistProvider } from './context/WatchlistContext.jsx'
import Dashboard, { DiscoverPage, ProfilePage, TrackerPage } from './components/Dashboard.jsx'
import StatsHistoryPage from './components/StatsHistoryPage.jsx'
import './App.css'

function LandingPage() {
  const { isAuthenticated } = useAuth()

  return (
    <main className="landing-page">
      <header className="site-header">
        <Link className="brand" to={isAuthenticated ? '/dashboard' : '/'} aria-label="SarangTV home">
          <img src="/logo.png" alt="SarangTV logo" className="brand-logo-img" />
          <span>Sarang<span className="brand-tv-accent">TV</span></span>
        </Link>
        <nav className="header-nav" aria-label="Account navigation">
          {isAuthenticated ? (
            <Link className="button button-primary button-small" to="/dashboard">Dashboard</Link>
          ) : (
            <>
              <Link className="login-link" to="/login">Log In</Link>
              <Link className="button button-primary button-small" to="/signup">Sign Up</Link>
            </>
          )}
        </nav>
      </header>

      <section className="hero-section">
        <div className="hero-content">
          <h1>Your K-drama <em>diary.</em></h1>
          <p>
            Track what you watch, rate the ones that hit different, and keep
            <br className="desktop-break" /> a simple record of your drama life — no fuss.
          </p>
          <div className="hero-actions">
            {isAuthenticated ? (
              <Link className="button button-primary" to="/dashboard">Go to Dashboard</Link>
            ) : (
              <>
                <Link className="button button-primary" to="/signup">Sign Up</Link>
                <Link className="button button-outline" to="/login">Log In</Link>
              </>
            )}
          </div>
        </div>
      </section>
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
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [policyModal, setPolicyModal] = useState(null)
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

    // Client verification: user must agree to Terms and Privacy Policy before proceeding
    if (isSignup && !termsAccepted) {
      setFieldErrors((prev) => ({
        ...prev,
        terms_privacy_accepted: ['You must agree to the Terms and Data Privacy Policy to create an account.'],
      }))
      return
    }

    setIsSubmitting(true)

    try {
      if (isSignup) {
        await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          password_confirmation: formData.password_confirmation,
          terms_privacy_accepted: true,
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
      <div className={`auth-container ${isSignup ? 'signup-container' : 'login-container'}`}>
        <div className="auth-nav-bar">
          <Link className="back-link" to="/" aria-label="Back to home">
            <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
            Back
          </Link>
          <Link className="auth-brand" to="/" aria-label="SarangTV home">
            <img src="/logo.png" alt="SarangTV logo" className="brand-logo-img" />
            <span>Sarang<span className="brand-tv-accent">TV</span></span>
          </Link>
          <div className="auth-nav-spacer" aria-hidden="true" />
        </div>

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
          {isSignup ? (
            <div className="auth-fields-grid">
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
                    placeholder="Min. 8 characters"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <Eye size={17} /> : <EyeOff size={17} />}
                  </button>
                </span>
                {fieldErrors.password && (
                  <span className="field-error-text">{fieldErrors.password[0]}</span>
                )}
              </label>

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
            </div>
          ) : (
            <div className="auth-fields-stack">
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
                    placeholder="••••••••"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <Eye size={17} /> : <EyeOff size={17} />}
                  </button>
                </span>
                {fieldErrors.password && (
                  <span className="field-error-text">{fieldErrors.password[0]}</span>
                )}
              </label>
            </div>
          )}

          {!isSignup && <Link className="forgot-link" to="/login">Forgot password?</Link>}

          {/* Terms & Data Privacy Policy agreement checkbox (registration only) */}
          {isSignup && (
            <div className="auth-terms-group">
              <label className="auth-terms-label" htmlFor="terms_privacy_accepted">
                <input
                  type="checkbox"
                  name="terms_privacy_accepted"
                  id="terms_privacy_accepted"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked)
                    if (fieldErrors.terms_privacy_accepted) {
                      setFieldErrors((prev) => {
                        const updated = { ...prev }
                        delete updated.terms_privacy_accepted
                        return updated
                      })
                    }
                  }}
                  disabled={isSubmitting}
                  className="auth-terms-checkbox"
                />
                <span className="auth-terms-text">
                  I agree to the{' '}
                  <button
                    type="button"
                    className="auth-terms-link"
                    onClick={() => setPolicyModal('terms')}
                  >
                    Terms
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    className="auth-terms-link"
                    onClick={() => setPolicyModal('privacy')}
                  >
                    Data Privacy Policy
                  </button>
                </span>
              </label>
              {fieldErrors.terms_privacy_accepted && (
                <span className="field-error-text terms-error-text">
                  {fieldErrors.terms_privacy_accepted[0]}
                </span>
              )}
            </div>
          )}

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

      {/* Terms & Data Privacy Policy Modal */}
      {policyModal && (
        <div
          className="policy-modal-overlay"
          onClick={() => setPolicyModal(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="policy-dialog-title"
        >
          <div className="policy-modal-card" onClick={(e) => e.stopPropagation()}>
            <header className="policy-modal-header">
              <div className="policy-modal-title-group">
                {policyModal === 'terms' ? (
                  <FileText size={20} className="policy-icon" />
                ) : (
                  <ShieldCheck size={20} className="policy-icon" />
                )}
                <h2 id="policy-dialog-title">
                  {policyModal === 'terms' ? 'Terms of Service' : 'Data Privacy Policy'}
                </h2>
              </div>
              <button
                type="button"
                className="policy-modal-close"
                onClick={() => setPolicyModal(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </header>

            <div className="policy-modal-body">
              {policyModal === 'terms' ? (
                <>
                  <p className="policy-updated">Effective: September 2026</p>
                  <section className="policy-section">
                    <h3>1. Agreement to Terms</h3>
                    <p>
                      By creating a SarangTV account, you agree to these Terms of Service. SarangTV
                      is a platform for tracking, discovering, and logging your personal Korean Drama
                      viewing journey.
                    </p>
                  </section>
                  <section className="policy-section">
                    <h3>2. User Account and Security</h3>
                    <p>
                      You are responsible for safeguarding your login credentials. Each account is
                      intended for individual use to maintain personalized watchlist data, ratings,
                      and private notes.
                    </p>
                  </section>
                  <section className="policy-section">
                    <h3>3. Personal Tracking & Content</h3>
                    <p>
                      Your watchlist, watching statuses, ratings, and episode progress are stored
                      for personal non-commercial entertainment management. Automated scraping or
                      abuse of SarangTV services is strictly prohibited.
                    </p>
                  </section>
                  <section className="policy-section">
                    <h3>4. Third-Party Metadata</h3>
                    <p>
                      K-Drama metadata, titles, images, and cast information are provided via The
                      Movie Database (TMDB) API and remain the intellectual property of their respective
                      creators and broadcasters.
                    </p>
                  </section>
                  <section className="policy-section">
                    <h3>5. Account Termination</h3>
                    <p>
                      You may terminate your account at any time. Upon termination, all personal
                      watchlist entries and account records can be permanently deleted.
                    </p>
                  </section>
                </>
              ) : (
                <>
                  <p className="policy-updated">Effective: September 2026</p>
                  <section className="policy-section">
                    <h3>1. Information We Collect</h3>
                    <p>
                      We collect your name, email address, and encrypted password during registration.
                      As you use the application, we store your personal watchlist items, episode
                      progress, star ratings, and personal notes.
                    </p>
                  </section>
                  <section className="policy-section">
                    <h3>2. How We Use Your Information</h3>
                    <p>
                      Your information is used solely to provide and synchronize your watchlist across
                      sessions and devices. We never sell, rent, or monetize your personal data to
                      third parties or advertisers.
                    </p>
                  </section>
                  <section className="policy-section">
                    <h3>3. Third-Party Integrations</h3>
                    <p>
                      SarangTV queries TMDB for drama catalog information and poster assets. No user
                      identifying details or personal data are shared with TMDB or external services.
                    </p>
                  </section>
                  <section className="policy-section">
                    <h3>4. Data Security</h3>
                    <p>
                      We use industry-standard encryption, password hashing, and token-based
                      authentication (Laravel Sanctum) to ensure your account and watchlist data
                      remain safe and private.
                    </p>
                  </section>
                  <section className="policy-section">
                    <h3>5. Your Privacy Rights</h3>
                    <p>
                      You retain full control over your data. You may review, update, or permanently
                      delete your account and tracking history at any time.
                    </p>
                  </section>
                </>
              )}
            </div>

            <footer className="policy-modal-footer">
              <button
                type="button"
                className="policy-modal-accept-btn"
                onClick={() => {
                  setTermsAccepted(true)
                  if (fieldErrors.terms_privacy_accepted) {
                    setFieldErrors((prev) => {
                      const updated = { ...prev }
                      delete updated.terms_privacy_accepted
                      return updated
                    })
                  }
                  setPolicyModal(null)
                }}
              >
                Agree & Close
              </button>
              <button
                type="button"
                className="policy-modal-close-btn"
                onClick={() => setPolicyModal(null)}
              >
                Close
              </button>
            </footer>
          </div>
        </div>
      )}

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
            <Route
              path="/stats"
              element={
                <ProtectedRoute>
                  <StatsHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/stats"
              element={
                <ProtectedRoute>
                  <StatsHistoryPage />
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
