import { useEffect, useRef, useState } from 'react'
import { Camera, Check, Heart, Lock, Mail, Sparkles, Upload, User, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
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
  const { user, updateProfile } = useAuth()
  const fileInputRef = useRef(null)

  const currentAvatar = user?.avatar || user?.avatar_url || dashboardUser.avatar
  const currentAvatarType = user?.avatarType || (user?.avatarIcon ? 'persona' : 'photo')
  const currentName = user?.name || ''
  const currentEmail = user?.email || ''

  const [name, setName] = useState(currentName)
  const [avatarType, setAvatarType] = useState(currentAvatarType)
  const [avatarPreview, setAvatarPreview] = useState(currentAvatar)
  const [newAvatarData, setNewAvatarData] = useState(null)
  const [selectedIcon, setSelectedIcon] = useState(user?.avatarIcon || 'heart')
  const [selectedColor, setSelectedColor] = useState(user?.color || PROFILE_COLORS[0])
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

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
    <div className="modal-overlay" onClick={isSaving ? undefined : onClose} role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
      <div className="edit-profile-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="edit-profile-header">
          <div className="modal-header-copy">
            <div className="modal-tag">
              <Sparkles size={14} /> Profile Settings
            </div>
            <h2 id="edit-profile-title">Edit Profile</h2>
            <p>Pick an icon and theme, or upload a custom photo.</p>
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
          <div className="edit-profile-feedback">
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
          </div>

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

          <div
            className={`edit-profile-avatar-section ${avatarType === 'photo' ? 'photo-mode' : 'persona-mode'}`}
            role="tabpanel"
            aria-label={avatarType === 'photo' ? 'Custom photo settings' : 'Drama persona settings'}
          >
            <div className="edit-avatar-preview-wrapper" style={avatarType === 'persona' ? { backgroundColor: selectedColor } : undefined}>
              {avatarType === 'persona' ? (
                <DramaPersonaAvatar personaId={selectedIcon} color={selectedColor} iconSize={34} />
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
                        <span className="edit-persona-option-icon" style={{ backgroundColor: selectedIcon === id ? selectedColor : undefined }}>
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

          <div className="edit-profile-details">
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
