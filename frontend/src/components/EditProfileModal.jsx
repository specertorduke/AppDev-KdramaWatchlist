import { useEffect, useRef, useState } from 'react'
import { Camera, Check, Lock, Mail, Sparkles, Upload, User, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { dashboardUser } from '../data/dashboardData.js'

export default function EditProfileModal({ isOpen, onClose }) {
  const { user, updateProfile } = useAuth()
  const fileInputRef = useRef(null)

  const currentAvatar = user?.avatar || user?.avatar_url || dashboardUser.avatar
  const currentName = user?.name || ''
  const currentEmail = user?.email || ''

  const [name, setName] = useState(currentName)
  const [avatarPreview, setAvatarPreview] = useState(currentAvatar)
  const [newAvatarData, setNewAvatarData] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Sync state whenever modal opens or user data changes
  useEffect(() => {
    if (isOpen) {
      setName(user?.name || '')
      setAvatarPreview(user?.avatar || user?.avatar_url || dashboardUser.avatar)
      setNewAvatarData(null)
      setErrorMessage('')
      setSuccessMessage('')
    }
  }, [isOpen, user])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSaving) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSaving, onClose])

  if (!isOpen) return null

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image file must be under 5MB.')
      return
    }

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG, PNG, or WEBP).')
      return
    }

    setErrorMessage('')
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result
      if (dataUrl) {
        setAvatarPreview(dataUrl)
        setNewAvatarData(dataUrl)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async (e) => {
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
      // Only send fields that are allowed to be updated (never send email)
      await updateProfile({
        name: trimmedName,
        avatar: newAvatarData || avatarPreview,
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
    <div className="modal-overlay" onClick={isSaving ? undefined : onClose} role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
      <div className="edit-profile-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="edit-profile-header">
          <div className="modal-header-copy">
            <div className="modal-tag">
              <Sparkles size={14} /> Profile Settings
            </div>
            <h2 id="edit-profile-title">Edit Profile</h2>
            <p>Update your photo and display name.</p>
          </div>
          <button
            className="modal-close-button"
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="edit-profile-form">
          {errorMessage && (
            <div className="edit-profile-alert error" role="alert">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="edit-profile-alert success" role="status">
              <Check size={16} /> {successMessage}
            </div>
          )}

          {/* Profile Picture Section */}
          <div className="edit-profile-avatar-section">
            <div className="edit-avatar-preview-wrapper">
              <img
                src={avatarPreview}
                alt="Profile preview"
                className="edit-avatar-img"
              />
              <button
                type="button"
                className="edit-avatar-overlay-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving}
                aria-label="Change profile picture"
              >
                <Camera size={18} />
              </button>
            </div>

            <div className="edit-avatar-actions">
              <button
                type="button"
                className="edit-avatar-choose-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving}
              >
                <Upload size={14} /> Change Photo
              </button>
              <span className="edit-avatar-hint">JPG, PNG or WEBP · Max 5MB</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="edit-avatar-hidden-input"
                onChange={handleFileSelect}
                aria-label="Upload profile image"
              />
            </div>
          </div>

          {/* Username Field (Editable) */}
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
              autoFocus
            />
          </div>

          {/* Email Field (Read-only) */}
          <div className="edit-profile-field">
            <div className="edit-field-label-row">
              <label htmlFor="edit-profile-email">
                <Mail size={15} /> Email Address
              </label>
              <span className="edit-field-readonly-badge">
                <Lock size={12} /> Read-only
              </span>
            </div>
            <input
              id="edit-profile-email"
              type="email"
              className="edit-profile-input edit-profile-input-readonly"
              value={currentEmail}
              readOnly
              disabled
              aria-readonly="true"
              tabIndex={-1}
            />
            <p className="edit-field-hint">Your email is used for account login and cannot be changed.</p>
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
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

