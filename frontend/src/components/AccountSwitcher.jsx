import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Heart,
  PawPrint,
  Plus,
  Sparkles,
  Star,
  Tv,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const TILE_THEMES = [
  { bg: '#eb5b78', color: '#ffffff', Icon: Heart },
  { bg: '#5a222f', color: '#ffffff', Icon: PawPrint },
  { bg: '#45202c', color: '#ffffff', Icon: Sparkles },
  { bg: '#b85b73', color: '#ffffff', Icon: Star },
  { bg: '#702d3e', color: '#ffffff', Icon: Tv },
]

export default function AccountSwitcher({ onAddAccount }) {
  const navigate = useNavigate()
  const { user, isAuthenticated, savedAccounts, switchAccount, removeSavedAccount } = useAuth()
  const [isManaging, setIsManaging] = useState(false)
  const [switchingId, setSwitchingId] = useState(null)

  const currentKey = user?.id || user?.email
  const displayAccounts = Array.isArray(savedAccounts) && savedAccounts.length > 0
    ? savedAccounts
    : user
    ? [{
        id: user.id,
        email: user.email,
        name: user.name || user.email?.split('@')[0] || 'User',
        avatar: user.avatar || user.avatar_url || '',
        user,
      }]
    : []

  const handleSelectAccount = async (acc) => {
    if (isManaging) return

    const accKey = acc.id || acc.email
    if (isAuthenticated && accKey === currentKey) {
      navigate('/dashboard')
      return
    }

    setSwitchingId(accKey)
    const success = await switchAccount(accKey)
    setSwitchingId(null)
    if (success) {
      navigate('/dashboard')
    } else if (onAddAccount) {
      onAddAccount()
    }
  }

  const handleRemove = (e, acc) => {
    e.stopPropagation()
    const accKey = acc.id || acc.email
    if (window.confirm(`Remove "${acc.name || acc.email}" from saved accounts on this device?`)) {
      removeSavedAccount(accKey)
    }
  }

  const handleAddClick = () => {
    if (onAddAccount) {
      onAddAccount()
    }
  }

  return (
    <main className="account-switcher-page">
      {/* Top back navigation to home */}
      <header className="account-switcher-header">
        <button
          type="button"
          className="switcher-back-link"
          onClick={() => navigate('/')}
          aria-label="Back to home"
        >
          <ArrowLeft size={14} strokeWidth={2} />
          <span>Back to Home</span>
        </button>
      </header>

      <div className="account-switcher-container">
        {/* Brand & Mascot */}
        <div className="account-switcher-brand">
          <img src="/logo.png" alt="SarangTV mascot" className="switcher-logo-img" />
          <h2 className="switcher-brand-title">
            Sarang<span className="brand-tv-accent">TV</span>
          </h2>
        </div>

        {/* Headings */}
        <div className="account-switcher-headings">
          <h1>Who's tracking today?</h1>
          <p>Pick your profile to jump back into your watchlist</p>
        </div>

        {/* Account Tiles Grid */}
        <div className="account-cards-row" role="region" aria-label="Available accounts">
          {displayAccounts.map((acc, index) => {
            const isCurrent = (acc.id && user?.id && acc.id === user.id) || (acc.email && user?.email && acc.email.toLowerCase() === user.email.toLowerCase())
            const isSwitching = switchingId === (acc.id || acc.email)
            const theme = TILE_THEMES[index % TILE_THEMES.length]
            const ThemeIcon = theme.Icon
            const hasCustomPhoto = Boolean(acc.avatar && acc.avatar.startsWith('http'))

            return (
              <div
                key={acc.id || acc.email || index}
                className={`account-card ${isCurrent ? 'is-active-account' : ''} ${isManaging ? 'is-manage-mode' : ''} ${isSwitching ? 'is-switching' : ''}`}
                onClick={() => handleSelectAccount(acc)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSelectAccount(acc)
                  }
                }}
                aria-label={`Switch to account ${acc.name || acc.email}`}
              >
                {/* Tile avatar box */}
                <div
                  className="account-avatar-tile"
                  style={!hasCustomPhoto ? { backgroundColor: theme.bg, color: theme.color } : {}}
                >
                  {hasCustomPhoto ? (
                    <img src={acc.avatar} alt={acc.name} className="account-avatar-photo" />
                  ) : (
                    <ThemeIcon size={46} strokeWidth={2.3} className="account-theme-icon" />
                  )}

                  {/* Active Indicator Badge */}
                  {isCurrent && !isManaging && (
                    <div className="account-active-badge" title="Currently Active Account">
                      <UserCheck size={13} />
                    </div>
                  )}

                  {/* Remove Button in Manage Mode */}
                  {isManaging && (
                    <button
                      type="button"
                      className="account-remove-btn"
                      onClick={(e) => handleRemove(e, acc)}
                      title={`Remove ${acc.name || acc.email}`}
                      aria-label={`Remove ${acc.name || acc.email}`}
                    >
                      <X size={16} strokeWidth={2.5} />
                    </button>
                  )}
                </div>

                {/* Account Name */}
                <span className="account-name-label" title={acc.name || acc.email}>
                  {acc.name || acc.email?.split('@')[0] || 'User'}
                </span>
              </div>
            )
          })}

          {/* Add Account Card -> Reveals Login Card */}
          {!isManaging && (
            <div
              className="account-card add-account-card"
              onClick={handleAddClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleAddClick()
                }
              }}
              aria-label="Add new account"
            >
              <div className="account-avatar-tile add-account-tile">
                <Plus size={38} strokeWidth={2.2} className="add-account-plus-icon" />
              </div>
              <span className="account-name-label">Add Account</span>
            </div>
          )}
        </div>

        {/* Secondary Action: Sign Up */}
        <div className="account-switcher-actions">
          <button
            type="button"
            className="switch-signup-btn"
            onClick={() => navigate('/signup')}
            aria-label="Sign up for a new account"
          >
            <UserPlus size={18} />
            <span>Sign Up</span>
          </button>
        </div>

        {/* Manage Accounts Toggle Button */}
        {displayAccounts.length > 0 && (
          <div className="account-switcher-footer">
            <button
              type="button"
              className={`manage-accounts-btn ${isManaging ? 'active' : ''}`}
              onClick={() => setIsManaging((prev) => !prev)}
            >
              {isManaging ? 'Done' : 'Manage Accounts'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

