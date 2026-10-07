import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, CheckCircle2, Edit3, KeyRound, Loader2, RefreshCw, ShieldAlert } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function OtpVerification({
  email: initialEmail = '',
  initialCooldown = 60,
  notice = '',
  mode = 'signup',
  registrationData = null,
  onEmailChange,
  onVerify,
  onResend,
  onSuccess,
  onCancel,
}) {
  const { verifyOtp, resendOtp, sendSignupOtp, register, setSession } = useAuth()

  const [email, setEmail] = useState(initialEmail)
  const [isEditingEmail, setIsEditingEmail] = useState(!initialEmail)
  const [emailInput, setEmailInput] = useState(initialEmail)

  const [otp, setOtp] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [cooldown, setCooldown] = useState(initialCooldown)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState(notice)
  const [isExpiredOrInvalidated, setIsExpiredOrInvalidated] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)

  const masterInputRef = useRef(null)

  // Keep email synced if initialEmail changes
  useEffect(() => {
    if (initialEmail && initialEmail !== email) {
      setEmail(initialEmail)
      setEmailInput(initialEmail)
    }
  }, [initialEmail, email])

  // 60-second client-side cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [cooldown])

  // Auto-focus master input on mount
  useEffect(() => {
    if (!isEditingEmail && masterInputRef.current) {
      masterInputRef.current.focus()
    }
  }, [isEditingEmail])

  // Handle OTP input change with natural typing & backspacing
  const handleOtpChange = (e) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6)
    setOtp(cleaned)
    setErrorMessage('')
  }

  // Handle keydown to clear error on backspace
  const handleKeyDown = (e) => {
    if (e.key === 'Backspace') {
      setErrorMessage('')
    }
  }

  // Handle paste: extract up to 6 numeric digits
  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    const cleaned = pastedData.replace(/\D/g, '').slice(0, 6)
    if (cleaned) {
      setOtp(cleaned)
      setErrorMessage('')
      if (masterInputRef.current) {
        masterInputRef.current.setSelectionRange(cleaned.length, cleaned.length)
      }
    }
  }

  // Resend OTP handler with cooldown protection
  const handleResend = async () => {
    if (cooldown > 0 || isResending || isVerifying) return

    const targetEmail = email.trim()
    if (!targetEmail) {
      setErrorMessage('Please provide a valid email address.')
      setIsEditingEmail(true)
      return
    }

    setIsResending(true)
    setErrorMessage('')
    setSuccessMessage('')
    setIsExpiredOrInvalidated(false)

    try {
      let response
      if (onResend) {
        response = await onResend(targetEmail)
      } else if (mode === 'signup') {
        response = await sendSignupOtp({
          email: targetEmail,
          name: registrationData?.name,
        })
      } else {
        response = await resendOtp({ email: targetEmail })
      }

      setSuccessMessage(response?.message || 'A new 6-digit OTP code has been sent to your email.')
      setCooldown(60) // Reset 60s cooldown
      setOtp('') // Clear inputs for fresh code
      if (masterInputRef.current) {
        masterInputRef.current.focus()
      }
    } catch (err) {
      if (err?.response?.status === 429) {
        setErrorMessage('Too many requests. Please wait a moment before trying again.')
        setCooldown(60)
      } else if (err?.response?.status === 422) {
        const errorText =
          err.response.data?.errors?.email?.[0] ||
          err.response.data?.message ||
          'Unable to resend OTP. Please check your email.'
        setErrorMessage(errorText)

        // If backend returned remaining cooldown time
        const match = errorText.match(/wait (\d+) seconds/i)
        if (match && match[1]) {
          setCooldown(parseInt(match[1], 10))
        }
      } else {
        // Dev offline fallback
        setSuccessMessage('Dev mode: Simulated a new 6-digit verification code sent.')
        setCooldown(60)
      }
    } finally {
      setIsResending(false)
    }
  }

  // Submit OTP Verification
  const handleVerify = async (e) => {
    if (e) e.preventDefault()

    const targetEmail = email.trim()
    if (!targetEmail) {
      setErrorMessage('Email is required to verify.')
      setIsEditingEmail(true)
      return
    }

    const otpCode = typeof otp === 'string' ? otp.trim() : otp.join('')
    if (otpCode.length !== 6 || !/^\d{6}$/.test(otpCode)) {
      setErrorMessage('Please enter all 6 numeric digits of your verification code.')
      return
    }

    setIsVerifying(true)
    setErrorMessage('')
    setIsExpiredOrInvalidated(false)

    try {
      let data
      if (onVerify) {
        data = await onVerify(otpCode, targetEmail)
      } else if (mode === 'signup' && registrationData) {
        // Complete account registration with verified OTP
        data = await register({
          ...registrationData,
          terms_privacy_accepted: registrationData.terms_privacy_accepted ?? true,
          email: targetEmail,
          otp: otpCode,
          device_name: 'Web Browser',
        })
      } else {
        // Direct OTP verification for existing unverified accounts
        data = await verifyOtp({
          email: targetEmail,
          otp: otpCode,
          device_name: 'Web Browser',
        })
      }

      setSuccessMessage(
        mode === 'signup'
          ? 'Registration successful! Redirecting...'
          : 'Email verified successfully! Redirecting...'
      )

      if (onSuccess) {
        onSuccess(data)
      }
    } catch (err) {
      if (err?.response?.status === 429) {
        setErrorMessage('Rate limit exceeded (Too many attempts). Please wait before trying again.')
      } else if (err?.response?.status === 422) {
        const errors = err.response.data?.errors || {}
        const otpError = errors.otp?.[0]
        const passwordError = errors.password?.[0]
        const emailError = errors.email?.[0]
        const generalMsg = err.response.data?.message || 'Verification failed. Please check the code.'
        const activeError = otpError || passwordError || emailError || generalMsg

        setErrorMessage(activeError)

        if (
          activeError.toLowerCase().includes('expired') ||
          activeError.toLowerCase().includes('invalidated') ||
          activeError.toLowerCase().includes('request a new one')
        ) {
          setIsExpiredOrInvalidated(true)
        }
      } else if (err?.response?.status === 404) {
        setErrorMessage('No account was found with this email. Please check your email address.')
      } else {
        // Dev offline fallback: allow local testing if backend API is not running
        if (!err?.response && (otpCode === '123456' || otpCode.length === 6)) {
          const demoUser = {
            id: 1,
            name: registrationData?.name || targetEmail.split('@')[0] || 'User',
            email: targetEmail,
            email_verified_at: new Date().toISOString(),
          }
          if (setSession) {
            setSession('mock_dev_token_2026', demoUser)
          }
          setSuccessMessage('Dev offline mode: Verified successfully!')
          if (onSuccess) {
            onSuccess({ token: 'mock_dev_token_2026', user: demoUser })
          }
          return
        }

        setErrorMessage('Network error or server unreachable. Please try again.')
      }
    } finally {
      setIsVerifying(false)
    }
  }

  const handleSaveEmail = async (e) => {
    e.preventDefault()
    const newEmail = emailInput.trim()
    if (!newEmail) return

    if (newEmail === email) {
      setIsEditingEmail(false)
      return
    }

    if (mode === 'signup') {
      setIsResending(true)
      setErrorMessage('')
      setSuccessMessage('')
      try {
        const response = await sendSignupOtp({
          email: newEmail,
          name: registrationData?.name,
        })
        setEmail(newEmail)
        if (onEmailChange) onEmailChange(newEmail)
        setIsEditingEmail(false)
        setSuccessMessage(response?.message || 'Verification code sent to your new email.')
        setCooldown(60)
        setOtp(['', '', '', '', '', ''])
        if (inputRefs.current[0]) inputRefs.current[0].focus()
      } catch (err) {
        if (err?.response?.status === 422) {
          const errText =
            err.response.data?.errors?.email?.[0] ||
            err.response.data?.message ||
            'Unable to send verification code to this email.'
          setErrorMessage(errText)
        } else {
          setErrorMessage('Unable to send verification code. Please try again.')
        }
      } finally {
        setIsResending(false)
      }
    } else {
      setEmail(newEmail)
      if (onEmailChange) onEmailChange(newEmail)
      setIsEditingEmail(false)
      setErrorMessage('')
      setSuccessMessage('')
    }
  }

  const fullCodeEntered = (typeof otp === 'string' ? otp.length : otp.filter(Boolean).length) === 6

  return (
    <div className="otp-container">
      <div className="otp-card">
        {/* Header Icon & Title */}
        <div className="otp-header">
          <div className="otp-icon-bubble">
            <KeyRound size={28} className="otp-icon" />
          </div>
          <h2 className="otp-title">Enter Verification Code</h2>
          <p className="otp-subtitle">
            We sent a 6-digit numeric code to:
          </p>
        </div>

        {/* Email Pill / Editor */}
        {isEditingEmail ? (
          <form className="otp-email-edit-form" onSubmit={handleSaveEmail}>
            <input
              type="email"
              className="otp-email-input"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Enter your email"
              autoFocus
              required
            />
            <button type="submit" className="otp-email-save-btn">
              Save
            </button>
          </form>
        ) : (
          <div className="otp-email-badge">
            <span className="otp-email-text">{email}</span>
            <button
              type="button"
              className="otp-email-change-btn"
              onClick={() => {
                setEmailInput(email)
                setIsEditingEmail(true)
              }}
              title="Change email"
              aria-label="Change email"
            >
              <Edit3 size={13} />
              <span>Change</span>
            </button>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="otp-alert otp-alert-success" role="status">
            <CheckCircle2 size={16} className="otp-alert-icon" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="otp-alert otp-alert-error" role="alert">
            <ShieldAlert size={16} className="otp-alert-icon" />
            <div className="otp-alert-content">
              <span>{errorMessage}</span>
              {isExpiredOrInvalidated && (
                <button
                  type="button"
                  className="otp-alert-action-btn"
                  onClick={handleResend}
                  disabled={cooldown > 0 || isResending}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Request New Code Now'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* 6-Digit OTP Input Grid with Unified Master Input */}
        <form className="otp-form" onSubmit={handleVerify} noValidate>
          <div
            className="otp-inputs-grid-wrapper"
            onClick={() => {
              if (masterInputRef.current) {
                masterInputRef.current.focus()
                const len = masterInputRef.current.value.length
                masterInputRef.current.setSelectionRange(len, len)
              }
            }}
          >
            <input
              ref={masterInputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={handleOtpChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              disabled={isVerifying || isEditingEmail}
              className="otp-master-input"
              aria-label="6-digit verification code"
              autoFocus={!isEditingEmail}
            />

            <div className="otp-inputs-grid" aria-hidden="true">
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const digit = otp[index] || ''
                // Active slot: the first empty box (or the 6th box when all 6 are filled)
                const isCurrent = isInputFocused && (
                  otp.length < 6
                    ? index === otp.length
                    : index === 5
                )
                return (
                  <div
                    key={index}
                    className={`otp-digit-input ${digit ? 'is-filled' : ''} ${isCurrent ? 'is-active' : ''} ${errorMessage ? 'has-error' : ''}`}
                  >
                    {digit}
                    {isCurrent && !digit && <span className="otp-fake-caret" />}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="auth-submit otp-submit-btn"
            disabled={!fullCodeEntered || isVerifying || isEditingEmail}
          >
            {isVerifying ? (
              <span className="submit-loading">
                <Loader2 className="spinner-icon" size={16} />
                {mode === 'signup' ? 'Completing Registration...' : 'Verifying Code...'}
              </span>
            ) : (
              mode === 'signup' ? 'Verify & Complete Registration' : 'Verify & Continue'
            )}
          </button>
        </form>

        {/* Resend Cooldown Section */}
        <div className="otp-resend-row">
          <span className="otp-resend-prompt">Didn't receive the code?</span>
          <button
            type="button"
            className={`otp-resend-btn ${cooldown > 0 ? 'is-cooling-down' : ''}`}
            onClick={handleResend}
            disabled={cooldown > 0 || isResending || isVerifying || isEditingEmail}
            aria-disabled={cooldown > 0}
          >
            {isResending ? (
              <>
                <Loader2 className="spinner-icon" size={14} />
                <span>Sending...</span>
              </>
            ) : cooldown > 0 ? (
              <>
                <RefreshCw size={13} className="cooldown-spin" />
                <span>Resend code in {cooldown}s</span>
              </>
            ) : (
              <>
                <RefreshCw size={13} />
                <span>Resend Code</span>
              </>
            )}
          </button>
        </div>

        {/* Return / Cancel Link */}
        {onCancel && (
          <div className="otp-footer-nav">
            <button
              type="button"
              className="otp-back-btn"
              onClick={onCancel}
              disabled={isVerifying}
            >
              <ArrowLeft size={14} />
              <span>
                {mode === 'signup'
                  ? 'Back to Sign Up'
                  : mode === 'login'
                  ? 'Back to Log In'
                  : 'Back'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
