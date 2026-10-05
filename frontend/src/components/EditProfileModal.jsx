import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeftRight,
  Camera,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Heart,
  Loader2,
  Mail,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import authService from '../services/authService.js'
import { dashboardUser } from '../data/dashboardData.js'
import { DRAMA_PERSONAS, PROFILE_COLORS } from '../data/dramaPersonas.js'
import DramaPersonaAvatar from './DramaPersonaAvatar.jsx'

function compressProfileImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const imageUrl = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(imageUrl)
      const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))

      const context = canvas.getContext('2d')
      if (!context) {
        reject(new Error('Could not process this image. Please choose another file.'))
        return
      }

      context.fillStyle = '#fff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl)
      reject(new Error('Could not read this image. Please choose another file.'))
    }

    image.src = imageUrl
  })
}

export default function EditProfileModal({ isOpen, onClose }) {
  const { user, updateProfile, updateUserEmail, deleteAccount } = useAuth()
  const fileInputRef = useRef(null)

  const currentAvatar = user?.avatar || user?.avatar_url || dashboardUser.avatar
  const currentAvatarType = user?.avatarType || (user?.avatarIcon ? 'persona' : 'photo')
  const currentName = user?.name || ''
  const currentEmail = user?.email || ''

  // Profile Form States
  const [name, setName] = useState(currentName)
  const [avatarType, setAvatarType] = useState(currentAvatarType)
  const [avatarPreview, setAvatarPreview] = useState(currentAvatar)
  const [newAvatarData, setNewAvatarData] = useState(null)
  const [selectedIcon, setSelectedIcon] = useState(user?.avatarIcon || 'heart')
  const [selectedColor, setSelectedColor] = useState(user?.color || PROFILE_COLORS[0])
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Email Change Flow States (Matching Mobile Version 2-step OTP flow)
  const [showEmailFlow, setShowEmailFlow] = useState(false)
  const [emailStep, setEmailStep] = useState('input') // 'input' | 'otp'
  const [newEmail, setNewEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emailOtp, setEmailOtp] = useState('')
  const [isRequestingOtp, setIsRequestingOtp] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState('')
  const [resendTimer, setResendTimer] = useState(0)

  // Account Deletion Confirmation States
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  // Sync state whenever modal opens or user data changes
  useEffect(() => {
    if (isOpen) {
      setName(user?.name || '')
      setAvatarType(user?.avatarType || (user?.avatarIcon ? 'persona' : 'photo'))
      setAvatarPreview(user?.avatar || user?.avatar_url || dashboardUser.avatar)
      setNewAvatarData(null)
      setSelectedIcon(user?.avatarIcon || 'heart')
      setSelectedColor(user?.color || PROFILE_COLORS[0])
      setErrorMessage('')
      setSuccessMessage('')

      setShowEmailFlow(false)
      setEmailStep('input')
      setNewEmail('')
      setPassword('')
      setEmailOtp('')
      setEmailError('')
      setEmailSuccess('')
      setResendTimer(0)

      setShowDeleteModal(false)
      setDeletePassword('')
      setDeleteError('')
    }
  }, [isOpen, user])

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval = null
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0))
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [resendTimer])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSaving && !isRequestingOtp && !isVerifyingOtp && !isDeleting) {
        if (showDeleteModal) {
          setShowDeleteModal(false)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSaving, isRequestingOtp, isVerifyingOtp, isDeleting, showDeleteModal, onClose])

  if (!isOpen) return null

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    e.target.value = ''
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image file must be under 5MB.')
      return
    }

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG, PNG, or WEBP).')
      return
    }

    setErrorMessage('')
    try {
      const compressedImage = await compressProfileImage(file)
      setAvatarPreview(compressedImage)
      setNewAvatarData(compressedImage)
      setAvatarType('photo')
    } catch (err) {
      setErrorMessage(err.message || 'Could not process this image. Please choose another file.')
    }
  }

  const handleRemovePhoto = () => {
    setNewAvatarData(null)
    setAvatarPreview(dashboardUser.avatar)
    setAvatarType('persona')
  }

  // Step 1: Request Email Change (requires password re-auth)
  const handleRequestEmailChange = async (e) => {
    if (e) e.preventDefault()
    const trimmedEmail = newEmail.trim().toLowerCase()
    if (!trimmedEmail) {
      setEmailError('Please enter your new email address.')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address.')
      return
    }
    if (trimmedEmail === user?.email?.toLowerCase()) {
      setEmailError('New email must be different from current email.')
      return
    }
    if (!password) {
      setEmailError('Please enter your current password to continue.')
      return
    }

    setIsRequestingOtp(true)
    setEmailError('')
    setEmailSuccess('')

    try {
      await authService.requestEmailChange({
        new_email: trimmedEmail,
        password: password,
      })
      setEmailStep('otp')
      setResendTimer(60)
      setEmailOtp('')
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.new_email?.[0] ||
        err?.response?.data?.errors?.password?.[0] ||
        'Failed to request email change. Please check your password.'
      setEmailError(msg)
    } finally {
      setIsRequestingOtp(false)
    }
  }

  // Step 2: Verify 6-digit OTP & finalize email change
  const handleVerifyEmailChange = async (e) => {
    if (e) e.preventDefault()
    const trimmedOtp = emailOtp.trim()
    if (!trimmedOtp || trimmedOtp.length !== 6) {
      setEmailError('Please enter the 6-digit verification code.')
      return
    }

    setIsVerifyingOtp(true)
    setEmailError('')

    try {
      const trimmedEmail = newEmail.trim().toLowerCase()
      await authService.verifyEmailChange({
        new_email: trimmedEmail,
        otp: trimmedOtp,
      })

      // Update state and storage in auth context
      await updateUserEmail(trimmedEmail)

      setEmailSuccess('Email updated successfully!')
      setShowEmailFlow(false)
      setEmailStep('input')
      setNewEmail('')
      setPassword('')
      setEmailOtp('')
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.otp?.[0] ||
        'Verification failed. The code may be invalid or expired.'
      setEmailError(msg)
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  // Handle Account Deletion
  const handleDeleteAccountConfirm = async (e) => {
    if (e) e.preventDefault()
    if (!deletePassword) {
      setDeleteError('Please enter your password to confirm.')
      return
    }

    setIsDeleting(true)
    setDeleteError('')

    try {
      const res = await deleteAccount(deletePassword)
      if (res.success) {
        setShowDeleteModal(false)
        onClose()
        window.location.href = '/'
      } else {
        setDeleteError(res.error || 'Failed to delete account. Incorrect password.')
      }
    } catch {
      setDeleteError('An unexpected error occurred. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    const trimmedName = name.trim()
    if (!trimmedName) {
      setErrorMessage('Username cannot be empty.')
      return
    }

    setIsSaving(true)
    try {
      await updateProfile({
        name: trimmedName,
        ...(avatarType === 'photo'
          ? { avatar: newAvatarData || avatarPreview, avatarType: 'photo' }
          : { avatarIcon: selectedIcon, color: selectedColor, avatarType: 'persona' }),
      })

      setSuccessMessage('Profile updated successfully!')
      setTimeout(() => {
        onClose()
      }, 500)
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update profile. Please try again.'
      setErrorMessage(msg)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <div
        className="modal-overlay"
        onClick={isSaving || isDeleting ? undefined : onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
      >
        <div className="edit-profile-modal" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="edit-profile-header">
            <div className="modal-header-copy">
              <div className="modal-tag">
                <Sparkles size={14} /> Profile Settings
              </div>
              <h2 id="edit-profile-title">Edit Profile</h2>
              <p>Customize your identity, email security, and drama persona.</p>
            </div>
            <button
              className="modal-close-button"
              type="button"
              onClick={onClose}
              disabled={isSaving || isDeleting}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveProfile} className="edit-profile-form">
            <div className="edit-profile-feedback">
              {errorMessage && (
                <div className="edit-profile-alert error" role="alert">
                  <AlertCircle size={16} /> {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="edit-profile-alert success" role="status">
                  <Check size={16} /> {successMessage}
                </div>
              )}
            </div>

            {/* Avatar Style Switcher Tabs */}
            <div className="edit-profile-style-tabs" role="tablist" aria-label="Choose profile style">
              <button
                type="button"
                className={`edit-profile-style-tab ${avatarType === 'photo' ? 'active' : ''}`}
                role="tab"
                aria-selected={avatarType === 'photo'}
                onClick={() => setAvatarType('photo')}
                disabled={isSaving}
              >
                <Camera size={14} /> Custom Photo
              </button>
              <button
                type="button"
                className={`edit-profile-style-tab ${avatarType === 'persona' ? 'active' : ''}`}
                role="tab"
                aria-selected={avatarType === 'persona'}
                onClick={() => setAvatarType('persona')}
                disabled={isSaving}
              >
                <Heart size={14} /> Drama Persona
              </button>
            </div>

            {/* Avatar Section */}
            <div
              className={`edit-profile-avatar-section ${avatarType === 'photo' ? 'photo-mode' : 'persona-mode'}`}
              role="tabpanel"
              aria-label={avatarType === 'photo' ? 'Custom photo settings' : 'Drama persona settings'}
            >
              <div
                className="edit-avatar-preview-wrapper"
                style={avatarType === 'persona' ? { backgroundColor: selectedColor } : undefined}
              >
                {avatarType === 'persona' ? (
                  <DramaPersonaAvatar personaId={selectedIcon} color={selectedColor} iconSize={36} />
                ) : (
                  <img src={avatarPreview} alt="Profile preview" className="edit-avatar-img" />
                )}
              </div>

              {avatarType === 'photo' ? (
                <div className="edit-avatar-actions">
                  <button
                    type="button"
                    className="edit-avatar-choose-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSaving}
                  >
                    <Upload size={14} /> {newAvatarData ? 'Choose Another Photo' : 'Upload Photo'}
                  </button>
                  {newAvatarData && (
                    <button
                      type="button"
                      className="edit-avatar-remove-btn"
                      onClick={handleRemovePhoto}
                      disabled={isSaving}
                    >
                      Remove Photo
                    </button>
                  )}
                  <span className="edit-avatar-hint">JPG, PNG or WEBP · Max 5MB</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="edit-avatar-hidden-input"
                    onChange={handleFileSelect}
                    aria-label="Upload profile image"
                  />
                </div>
              ) : (
                <div className="edit-avatar-persona-picker">
                  <fieldset className="edit-persona-group">
                    <legend>Pick a color theme</legend>
                    <div className="edit-persona-colors">
                      {PROFILE_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`edit-persona-color ${selectedColor === color ? 'selected' : ''}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setSelectedColor(color)}
                          disabled={isSaving}
                          aria-label={`Choose color ${color}`}
                          aria-pressed={selectedColor === color}
                        >
                          {selectedColor === color && <Check size={13} />}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="edit-persona-group">
                    <legend>Choose your drama persona</legend>
                    <div className="edit-persona-grid">
                      {DRAMA_PERSONAS.map(({ id, label, Icon }) => (
                        <button
                          key={id}
                          type="button"
                          className={`edit-persona-option ${selectedIcon === id ? 'selected' : ''}`}
                          onClick={() => setSelectedIcon(id)}
                          disabled={isSaving}
                          aria-pressed={selectedIcon === id}
                          title={label}
                        >
                          <span
                            className="edit-persona-option-icon"
                            style={{ backgroundColor: selectedIcon === id ? selectedColor : undefined }}
                          >
                            <Icon size={18} aria-hidden="true" />
                          </span>
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </div>
              )}
            </div>

            {/* Profile Fields & Email Flow */}
            <div className="edit-profile-details">
              {/* Username Field */}
              <div className="edit-profile-field">
                <label htmlFor="edit-profile-name">
                  <User size={15} /> Username
                </label>
                <input
                  id="edit-profile-name"
                  type="text"
                  className="edit-profile-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your username"
                  maxLength={50}
                  disabled={isSaving}
                />
              </div>

              {/* Email Section (With 2-step OTP flow matching mobile version) */}
              <div className="edit-profile-field edit-email-section">
                <div className="edit-field-label-row">
                  <label htmlFor="edit-profile-email">
                    <Mail size={15} /> Account Email
                  </label>
                  {!showEmailFlow && (
                    <button
                      type="button"
                      className="edit-email-trigger-btn"
                      onClick={() => {
                        setShowEmailFlow(true)
                        setEmailStep('input')
                        setNewEmail('')
                        setPassword('')
                        setEmailOtp('')
                        setEmailError('')
                        setEmailSuccess('')
                      }}
                      disabled={isSaving}
                    >
                      <ArrowLeftRight size={13} /> Change Email
                    </button>
                  )}
                </div>

                {!showEmailFlow ? (
                  <div className="edit-email-idle-wrap">
                    <input
                      id="edit-profile-email"
                      type="email"
                      className="edit-profile-input edit-profile-input-readonly"
                      value={currentEmail}
                      readOnly
                      disabled
                      aria-readonly="true"
                    />
                    <p className="edit-field-hint">Your email is protected by two-factor verification for security.</p>
                  </div>
                ) : (
                  <div className="edit-email-flow-card">
                    {emailStep === 'input' ? (
                      <>
                        <div className="edit-email-step-header">
                          <ShieldCheck size={16} className="edit-email-step-icon" />
                          <strong>Change Account Email</strong>
                        </div>
                        <p className="edit-email-step-desc">
                          For your security, enter your new email and confirm your current password. A 6-digit verification code will be sent to the new email.
                        </p>

                        <div className="edit-email-input-group">
                          <label className="edit-email-sublabel">NEW EMAIL ADDRESS</label>
                          <input
                            type="email"
                            className="edit-profile-input"
                            value={newEmail}
                            onChange={(e) => {
                              setNewEmail(e.target.value)
                              if (emailError) setEmailError('')
                            }}
                            placeholder="e.g. name@example.com"
                            autoCapitalize="none"
                            autoCorrect="off"
                            disabled={isRequestingOtp}
                          />
                        </div>

                        <div className="edit-email-input-group">
                          <label className="edit-email-sublabel">CURRENT PASSWORD</label>
                          <div className="edit-password-input-wrap">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              className="edit-profile-input"
                              value={password}
                              onChange={(e) => {
                                setPassword(e.target.value)
                                if (emailError) setEmailError('')
                              }}
                              placeholder="Enter current password"
                              disabled={isRequestingOtp}
                            />
                            <button
                              type="button"
                              className="edit-password-toggle-btn"
                              onClick={() => setShowPassword(!showPassword)}
                              tabIndex={-1}
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>

                        {emailError && (
                          <div className="edit-email-error-box">
                            <AlertCircle size={15} />
                            <span>{emailError}</span>
                          </div>
                        )}

                        <div className="edit-email-btn-row">
                          <button
                            type="button"
                            className="edit-email-btn-secondary"
                            onClick={() => {
                              setShowEmailFlow(false)
                              setEmailError('')
                            }}
                            disabled={isRequestingOtp}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="edit-email-btn-primary"
                            onClick={handleRequestEmailChange}
                            disabled={isRequestingOtp}
                          >
                            {isRequestingOtp ? (
                              <>
                                <Loader2 size={14} className="spinner-icon" /> Sending Code...
                              </>
                            ) : (
                              'Send Code'
                            )}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="edit-email-step-header">
                          <Mail size={16} className="edit-email-step-icon" />
                          <strong>Enter Verification Code</strong>
                        </div>
                        <p className="edit-email-step-desc">
                          We sent a 6-digit confirmation code to{' '}
                          <strong className="edit-email-highlight">{newEmail}</strong>. Enter it below to confirm your new email.
                        </p>

                        <div className="edit-email-otp-container">
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            className="edit-email-otp-input"
                            value={emailOtp}
                            onChange={(e) => {
                              setEmailOtp(e.target.value.replace(/[^0-9]/g, ''))
                              if (emailError) setEmailError('')
                            }}
                            placeholder="••••••"
                            autoFocus
                            disabled={isVerifyingOtp}
                          />
                        </div>

                        {emailError && (
                          <div className="edit-email-error-box">
                            <AlertCircle size={15} />
                            <span>{emailError}</span>
                          </div>
                        )}

                        <div className="edit-email-resend-row">
                          {resendTimer > 0 ? (
                            <span className="edit-email-timer-text">
                              Resend code in <strong className="timer-count">{resendTimer}s</strong>
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="edit-email-resend-btn"
                              onClick={handleRequestEmailChange}
                              disabled={isRequestingOtp}
                            >
                              Resend verification code
                            </button>
                          )}
                        </div>

                        <div className="edit-email-btn-row">
                          <button
                            type="button"
                            className="edit-email-btn-secondary"
                            onClick={() => {
                              setEmailStep('input')
                              setEmailError('')
                            }}
                            disabled={isVerifyingOtp}
                          >
                            Back
                          </button>
                          <button
                            type="button"
                            className="edit-email-btn-primary"
                            onClick={handleVerifyEmailChange}
                            disabled={isVerifyingOtp}
                          >
                            {isVerifyingOtp ? (
                              <>
                                <Loader2 size={14} className="spinner-icon" /> Verifying...
                              </>
                            ) : (
                              'Verify & Update'
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {emailSuccess && (
                  <div className="edit-email-success-box">
                    <CheckCircle2 size={15} />
                    <span>{emailSuccess}</span>
                  </div>
                )}
              </div>

              {/* SECTION 4: DANGER ZONE (Account Deletion matching mobile ProfileScreen) */}
              <div className="edit-profile-danger-zone">
                <span className="edit-danger-heading">DANGER ZONE</span>
                <button
                  type="button"
                  className="edit-profile-danger-btn"
                  onClick={() => {
                    setDeletePassword('')
                    setDeleteError('')
                    setShowDeleteModal(true)
                  }}
                  disabled={isSaving}
                >
                  <Trash2 size={15} />
                  <span>Delete Account</span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="edit-profile-actions">
              <button
                type="button"
                className="edit-profile-btn-cancel"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="edit-profile-btn-save"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={15} className="spinner-icon" /> Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Account Confirmation Modal (Matching Mobile Version) */}
      {showDeleteModal && (
        <div
          className="modal-overlay danger-modal-overlay"
          onClick={() => !isDeleting && setShowDeleteModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="delete-account-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-header">
              <div className="delete-warning-icon-wrap">
                <AlertTriangle size={24} color="#EF4444" />
              </div>
              <div>
                <h3>Delete Account?</h3>
                <p>This action cannot be undone</p>
              </div>
              <button
                type="button"
                className="modal-close-button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                aria-label="Close delete modal"
              >
                <X size={18} />
              </button>
            </div>

            <p className="delete-modal-description">
              Please enter your password to confirm account deletion. All your watchlist data, favorite genres, and history will be permanently deleted.
            </p>

            <form onSubmit={handleDeleteAccountConfirm}>
              <div className="delete-input-group">
                <label htmlFor="delete-confirm-password">CURRENT PASSWORD</label>
                <input
                  id="delete-confirm-password"
                  type="password"
                  className="edit-profile-input"
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value)
                    if (deleteError) setDeleteError('')
                  }}
                  placeholder="Enter current password"
                  autoFocus
                  disabled={isDeleting}
                />
              </div>

              {deleteError && (
                <div className="edit-email-error-box" role="alert">
                  <AlertCircle size={15} />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="delete-modal-actions">
                <button
                  type="button"
                  className="delete-modal-btn-cancel"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="delete-modal-btn-confirm"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={14} className="spinner-icon" /> Deleting...
                    </>
                  ) : (
                    'Delete My Account'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
