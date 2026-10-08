import { useRef, useState } from 'react'
import { ArrowLeft, CheckCircle2, Eye, EyeOff, FileText, Loader2, ShieldCheck, X, XCircle } from 'lucide-react'
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { WatchlistProvider } from './context/WatchlistContext.jsx'
import Dashboard, { DiscoverPage, FavoriteGenresPage, ProfilePage, SettingsPage, TrackerPage } from './components/Dashboard.jsx'
import StatsHistoryPage from './components/StatsHistoryPage.jsx'
import OtpVerification from './components/OtpVerification.jsx'
import GenreOnboarding from './components/GenreOnboarding.jsx'
import PasswordRequirementsList from './components/PasswordRequirementsList.jsx'
import { checkPasswordRequirements } from './utils/passwordRequirements.js'
import authService from './services/authService.js'
import './App.css'

function LandingPage() {
  return (
    <main className="landing-page">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="SarangTV home">
          <img src="/logo.png" alt="SarangTV logo" className="brand-logo-img" />
          <span>Sarang<span className="brand-tv-accent">TV</span></span>
        </Link>
        <nav className="header-nav" aria-label="Account navigation">
          <Link className="login-link" to="/login">Log In</Link>
          <Link className="button button-primary button-small" to="/signup">Sign Up</Link>
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
            <Link className="button button-primary" to="/signup">Sign Up</Link>
            <Link className="button button-outline" to="/login">Log In</Link>
          </div>
        </div>
      </section>
    </main>
  )
}

function AuthPage({ mode }) {
  const isSignup = mode === 'signup'
  const navigate = useNavigate()
  const { login, sendSignupOtp, setSession } = useAuth()
  const [showOtpVerification, setShowOtpVerification] = useState(false)
  const [otpNotice, setOtpNotice] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    password_confirmation: '',
  })
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [policyModal, setPolicyModal] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmSubmitted, setConfirmSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  // Real-time availability status: null | 'checking' | 'available' | 'taken' | 'invalid'
  const [usernameStatus, setUsernameStatus] = useState(null)
  const [usernameStatusMsg, setUsernameStatusMsg] = useState('')
  const [emailStatus, setEmailStatus] = useState(null)
  const [emailStatusMsg, setEmailStatusMsg] = useState('')
  const usernameTimerRef = useRef(null)
  const emailTimerRef = useRef(null)

  // Forgot / Reset Password state
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotStep, setForgotStep] = useState('request') // 'request' | 'reset'
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotToken, setForgotToken] = useState('')
  const [resetNewPassword, setResetNewPassword] = useState('')
  const [resetNewConfirm, setResetNewConfirm] = useState('')
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState('')
  const [resetFieldErrors, setResetFieldErrors] = useState({})

  const handleRequestPasswordReset = async (e) => {
    e.preventDefault()
    setForgotError('')
    setForgotSuccess('')
    if (!forgotEmail || !forgotEmail.trim()) {
      setForgotError('Please enter your account email.')
      return
    }
    setForgotLoading(true)
    try {
      const res = await authService.forgotPassword({ email: forgotEmail.trim() })
      setForgotSuccess(res?.message || 'Password reset link / token has been sent to your email.')
      setForgotStep('reset')
    } catch (err) {
      setForgotError(
        err?.response?.data?.message ||
        err?.response?.data?.errors?.email?.[0] ||
        'Failed to send password reset code. Please check your email.'
      )
    } finally {
      setForgotLoading(false)
    }
  }

  const handleConfirmPasswordReset = async (e) => {
    e.preventDefault()
    setForgotError('')
    setForgotSuccess('')
    setResetFieldErrors({})

    if (!forgotToken || !forgotToken.trim()) {
      setResetFieldErrors({ token: ['Please enter the reset code or token from your email.'] })
      return
    }

    const { allRulesMet, isMatch } = checkPasswordRequirements(resetNewPassword, resetNewConfirm)
    if (!allRulesMet) {
      setResetFieldErrors({ password: ['Password must meet all complexity requirements.'] })
      return
    }
    if (!isMatch) {
      setResetFieldErrors({ password_confirmation: ['The password confirmation does not match.'] })
      return
    }

    setForgotLoading(true)
    try {
      const res = await authService.resetPassword({
        email: forgotEmail.trim(),
        token: forgotToken.trim(),
        password: resetNewPassword,
        password_confirmation: resetNewConfirm,
      })
      setForgotSuccess(res?.message || 'Your password has been reset successfully! You can now log in.')
      setTimeout(() => {
        setShowForgotModal(false)
        setFormData((prev) => ({ ...prev, email: forgotEmail.trim(), password: '' }))
      }, 2000)
    } catch (err) {
      if (err?.response?.status === 422 && err.response.data?.errors) {
        setResetFieldErrors(err.response.data.errors)
      }
      setForgotError(
        err?.response?.data?.message || 'Failed to reset password. Please check your reset token and password.'
      )
    } finally {
      setForgotLoading(false)
    }
  }

  if (isSignup && showOtpVerification) {
    return (
      <OtpVerification
        email={formData.email}
        registrationData={{ ...formData, username: formData.username.trim(), terms_privacy_accepted: true }}
        notice={otpNotice}
        onCancel={() => setShowOtpVerification(false)}
        onSuccess={() => navigate('/onboarding', { replace: true })}
      />
    )
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (name === 'password_confirmation' || name === 'password') {
      setConfirmSubmitted(false)
    }
    // Clear error for field on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }))
    }

    if (name === 'username' && isSignup) {
      const trimmed = value.trim()
      if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current)
      if (!trimmed) { setUsernameStatus(null); setUsernameStatusMsg(''); return }
      if (!/^[a-zA-Z0-9_]{3,30}$/.test(trimmed)) {
        setUsernameStatus('invalid')
        setUsernameStatusMsg('3–30 chars: letters, numbers, underscores only.')
        return
      }
      setUsernameStatus('checking')
      usernameTimerRef.current = setTimeout(async () => {
        try {
          const res = await authService.checkAvailability('username', trimmed)
          setUsernameStatus(res.available ? 'available' : 'taken')
          setUsernameStatusMsg(res.available ? 'Username is available.' : 'This username is already taken.')
        } catch { setUsernameStatus(null); setUsernameStatusMsg('') }
      }, 600)
    }

    if (name === 'email' && isSignup) {
      const trimmed = value.trim()
      if (emailTimerRef.current) clearTimeout(emailTimerRef.current)
      if (!trimmed) { setEmailStatus(null); setEmailStatusMsg(''); return }
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRe.test(trimmed)) { setEmailStatus(null); setEmailStatusMsg(''); return }
      setEmailStatus('checking')
      emailTimerRef.current = setTimeout(async () => {
        try {
          const res = await authService.checkAvailability('email', trimmed)
          setEmailStatus(res.available ? 'available' : 'taken')
          setEmailStatusMsg(res.available ? 'Email is available.' : 'An account with this email already exists.')
        } catch { setEmailStatus(null); setEmailStatusMsg('') }
      }, 600)
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

    // Client verification for password complexity rules before proceeding
    if (isSignup) {
      // Username is required
      if (!formData.username || !formData.username.trim()) {
        setFieldErrors((prev) => ({
          ...prev,
          username: ['Please enter a username.'],
        }))
        return
      }

      const { allRulesMet, isMatch } = checkPasswordRequirements(
        formData.password,
        formData.password_confirmation
      )
      if (!allRulesMet) {
        setFieldErrors((prev) => ({
          ...prev,
          password: ['Password must meet all complexity requirements.'],
        }))
        return
      }
      if (!isMatch) {
        setConfirmSubmitted(true)
        return
      }
    }

    setIsSubmitting(true)

    try {
      if (isSignup) {
        const response = await sendSignupOtp({
          email: formData.email,
          name: formData.name,
          password: formData.password,
        })
        setOtpNotice(response?.message || 'A verification code has been sent to your email.')
        setShowOtpVerification(true)
        return
      }

      await login({
        email: formData.email,
        password: formData.password,
      })
      navigate('/dashboard')
    } catch (err) {
      if (err.response) {
        if (err.response.status === 422 && err.response.data?.errors) {
          const errors = { ...err.response.data.errors }
          if (isSignup) {
            delete errors.password_confirmation
            if (err.response.data.errors.password_confirmation) {
              setConfirmSubmitted(true)
            }
          }
          setFieldErrors(errors)
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
        if (setSession) {
          setSession('mock_dev_token_2026', demoUser)
        } else {
          localStorage.setItem('sarangtv_token', 'mock_dev_token_2026')
          localStorage.setItem('sarangtv_user', JSON.stringify(demoUser))
        }
        navigate(isSignup ? '/onboarding' : '/dashboard')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasTypedConfirm = Boolean(formData.password_confirmation && formData.password_confirmation.length > 0)
  const shouldShowMatchMessage = hasTypedConfirm || confirmSubmitted
  const passwordsMatch = Boolean(hasTypedConfirm && formData.password && formData.password === formData.password_confirmation)

  return (
    <main className="auth-page">
      <div className={`auth-container ${isSignup ? 'signup-container' : 'login-container'}`}>
        <div className="auth-nav-bar">
          <button
            type="button"
            className="back-link"
            onClick={() => navigate('/')}
            aria-label="Back"
          >
            <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
            Back
          </button>
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
                <span>Display Name</span>
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="K-Drama Fan"
                  maxLength={255}
                  disabled={isSubmitting}
                />
                {fieldErrors.name && (
                  <span className="field-error-text">{fieldErrors.name[0]}</span>
                )}
              </label>

              <label className="auth-field">
                <span>@Username</span>
                <input
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="kdramafan2026"
                  maxLength={30}
                  autoCapitalize="off"
                  disabled={isSubmitting}
                />
                {usernameStatus === 'checking' && <span className="auth-field-hint auth-field-hint-checking">Checking…</span>}
                {usernameStatus === 'available' && <span className="auth-field-hint auth-field-hint-ok">✓ {usernameStatusMsg}</span>}
                {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <span className="auth-field-hint auth-field-hint-err">✕ {usernameStatusMsg}</span>}
                {fieldErrors.username && (
                  <span className="field-error-text">{fieldErrors.username[0]}</span>
                )}
              </label>

              <label className="auth-field auth-field-full">
                <span>Email</span>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  disabled={isSubmitting}
                />
                {emailStatus === 'checking' && <span className="auth-field-hint auth-field-hint-checking">Checking…</span>}
                {emailStatus === 'available' && <span className="auth-field-hint auth-field-hint-ok">✓ {emailStatusMsg}</span>}
                {emailStatus === 'taken' && <span className="auth-field-hint auth-field-hint-err">✕ {emailStatusMsg}</span>}
                {fieldErrors.email && (
                  <span className="field-error-text">{fieldErrors.email[0]}</span>
                )}
              </label>

              <div className="auth-field auth-field-full">
                <span>Password</span>
                <span className="password-input">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
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

                {/* Strength meter and compact checklist directly under Password */}
                <PasswordRequirementsList password={formData.password} />
              </div>

              <div className="auth-field auth-field-full">
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
                <div className="pwd-match-message-wrap">
                  {shouldShowMatchMessage ? (
                    <span
                      className={`pwd-match-message ${passwordsMatch ? 'match' : 'mismatch'}`}
                      aria-live="polite"
                    >
                      {passwordsMatch ? (
                        <>
                          <CheckCircle2 size={13} aria-hidden="true" />
                          Passwords match
                        </>
                      ) : (
                        <>
                          <XCircle size={13} aria-hidden="true" />
                          Passwords don't match yet
                        </>
                      )}
                    </span>
                  ) : (
                    <span className="pwd-match-spacer" aria-hidden="true">&nbsp;</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="auth-fields-stack">
              <label className="auth-field">
                <span>Email or Username</span>
                <input
                  name="email"
                  type="text"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email or Username"
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

          {!isSignup && (
            <button
              type="button"
              className="forgot-link"
              onClick={() => {
                setShowForgotModal(true)
                setForgotStep('request')
                setForgotEmail(formData.email || '')
                setForgotError('')
                setForgotSuccess('')
                setResetFieldErrors({})
              }}
            >
              Forgot password?
            </button>
          )}

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
            <Link to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Log in' : 'Sign up'} </Link>
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

      {/* Forgot / Reset Password Modal */}
      {showForgotModal && (
        <div
          className="policy-modal-overlay"
          onClick={() => !forgotLoading && setShowForgotModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="policy-modal-card forgot-modal-card" onClick={(e) => e.stopPropagation()}>
            <header className="policy-modal-header">
              <div className="policy-modal-title-group">
                <ShieldCheck size={20} className="policy-icon" />
                <h2>{forgotStep === 'request' ? 'Reset Your Password' : 'Set New Password'}</h2>
              </div>
              <button
                type="button"
                className="policy-modal-close"
                onClick={() => setShowForgotModal(false)}
                disabled={forgotLoading}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </header>

            <div className="policy-modal-body">
              {forgotSuccess && (
                <div className="auth-alert-box alert-success" style={{ marginBottom: '14px' }}>
                  <span>{forgotSuccess}</span>
                </div>
              )}
              {forgotError && (
                <div className="auth-alert-box alert-error" style={{ marginBottom: '14px' }}>
                  <span>{forgotError}</span>
                </div>
              )}

              {forgotStep === 'request' ? (
                <form onSubmit={handleRequestPasswordReset} className="auth-fields-stack">
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '13.5px', marginBottom: '8px' }}>
                    Enter the email associated with your SarangTV account. We will send you a password reset code.
                  </p>
                  <label className="auth-field">
                    <span>Email Address</span>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      disabled={forgotLoading}
                    />
                  </label>
                  <button
                    type="submit"
                    className="button button-primary"
                    style={{ width: '100%', marginTop: '12px' }}
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? 'Sending Reset Code...' : 'Send Reset Code'}
                  </button>
                  <div style={{ textAlign: 'center', marginTop: '10px' }}>
                    <button
                      type="button"
                      className="auth-terms-link"
                      onClick={() => setForgotStep('reset')}
                    >
                      Already have a reset token/code?
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleConfirmPasswordReset} className="auth-fields-stack">
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '13.5px', marginBottom: '8px' }}>
                    Enter your reset token and your new password.
                  </p>
                  <label className="auth-field">
                    <span>Email</span>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      disabled={forgotLoading}
                    />
                  </label>
                  <label className="auth-field">
                    <span>Reset Token / Code</span>
                    <input
                      type="text"
                      value={forgotToken}
                      onChange={(e) => setForgotToken(e.target.value)}
                      placeholder="Paste token or code"
                      required
                      disabled={forgotLoading}
                    />
                    {resetFieldErrors.token && (
                      <span className="field-error-text">{resetFieldErrors.token[0]}</span>
                    )}
                  </label>
                  <label className="auth-field">
                    <span>New Password</span>
                    <span className="password-input">
                      <input
                        type={showResetPassword ? 'text' : 'password'}
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        placeholder="Min. 8 chars, uppercase, number & symbol"
                        required
                        disabled={forgotLoading}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowResetPassword(!showResetPassword)}
                        aria-label={showResetPassword ? 'Hide password' : 'Show password'}
                      >
                        {showResetPassword ? <Eye size={17} /> : <EyeOff size={17} />}
                      </button>
                    </span>
                    {resetFieldErrors.password && (
                      <span className="field-error-text">{resetFieldErrors.password[0]}</span>
                    )}
                  </label>
                  <label className="auth-field">
                    <span>Confirm New Password</span>
                    <span className="password-input">
                      <input
                        type={showResetPassword ? 'text' : 'password'}
                        value={resetNewConfirm}
                        onChange={(e) => setResetNewConfirm(e.target.value)}
                        placeholder="Repeat your new password"
                        required
                        disabled={forgotLoading}
                      />
                    </span>
                    {resetFieldErrors.password_confirmation && (
                      <span className="field-error-text">{resetFieldErrors.password_confirmation[0]}</span>
                    )}
                  </label>

                  {/* Password requirements list shown dynamically */}
                  <PasswordRequirementsList
                    password={resetNewPassword}
                    confirmation={resetNewConfirm}
                  />

                  <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                    <button
                      type="button"
                      className="button button-outline"
                      onClick={() => setForgotStep('request')}
                      disabled={forgotLoading}
                      style={{ flex: 1 }}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="button button-primary"
                      disabled={forgotLoading}
                      style={{ flex: 2 }}
                    >
                      {forgotLoading ? 'Resetting Password...' : 'Reset Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
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
    return <Navigate to="/" replace />
  }

  return children
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WatchlistProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<AuthPage mode="login" />} />
              <Route path="/signup" element={<AuthPage mode="signup" />} />
              <Route path="/switch-account" element={<Navigate to="/login" replace />} />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <GenreOnboarding />
                  </ProtectedRoute>
                }
              />
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
                path="/favorite-genres"
                element={
                  <ProtectedRoute>
                    <FavoriteGenresPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
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
    </ThemeProvider>
  )
}

export default App
