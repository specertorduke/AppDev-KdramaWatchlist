import { useState } from 'react'
import {
  ArrowRight,
  Check,
  Coffee,
  Eye,
  Film,
  Heart,
  ShieldCheck,
  Smile,
  Sparkles,
  Zap,
  Flame,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import './GenreOnboarding.css'

const GENRES = [
  { id: 'Romance', label: 'Romance', Icon: Heart, color: '#F5A9C4' },
  { id: 'Comedy', label: 'Comedy', Icon: Smile, color: '#FFD166' },
  { id: 'Drama', label: 'Drama', Icon: Film, color: '#B8A5FF' },
  { id: 'Mystery', label: 'Mystery', Icon: Eye, color: '#70D6FF' },
  { id: 'Action', label: 'Action & Adventure', Icon: Zap, color: '#FF70A6' },
  { id: 'Sci-Fi & Fantasy', label: 'Fantasy & Sci-Fi', Icon: Sparkles, color: '#9B5DE5' },
  { id: 'Crime', label: 'Crime & Law', Icon: ShieldCheck, color: '#06D6A0' },
  { id: 'Family', label: 'Slice of Life & Family', Icon: Coffee, color: '#F39C12' },
  { id: 'Thriller', label: 'Thriller', Icon: Flame, color: '#FF4D6D' },
  { id: 'Horror', label: 'Horror', Icon: Eye, color: '#C9184A' },
]

export default function GenreOnboarding() {
  const navigate = useNavigate()
  const { user, updateUserPreferences } = useAuth()
  const [selected, setSelected] = useState(() => (
    Array.isArray(user?.favorite_genres) ? user.favorite_genres : []
  ))
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const toggleGenre = (genreId) => {
    setSelected((genres) => (
      genres.includes(genreId)
        ? genres.filter((genre) => genre !== genreId)
        : [...genres, genreId]
    ))
  }

  const handleContinue = async () => {
    setIsSaving(true)
    setSaveError('')
    const saved = await updateUserPreferences({ favoriteGenres: selected })
    setIsSaving(false)

    if (saved) {
      navigate('/dashboard', { replace: true })
    } else {
      setSaveError('Could not save your preferences. Try again or skip for now.')
    }
  }

  return (
    <main className="genre-onboarding-page">
      <div className="genre-onboarding-content">
        <header className="genre-onboarding-topbar">
          <span className="genre-onboarding-badge">
            <Sparkles size={15} aria-hidden="true" />
            Personalize Your Feed
          </span>
          <button type="button" className="genre-onboarding-skip" onClick={() => navigate('/dashboard', { replace: true })}>
            Skip for now
          </button>
        </header>

        <section className="genre-onboarding-intro">
          <h1>What do you love watching?</h1>
          <p>Select your favorite genres so SarangTV can personalize your recommendations and home dashboard.</p>
        </section>

        <section className="genre-onboarding-grid" aria-label="Favorite genres">
          {GENRES.map(({ id, label, Icon, color }) => {
            const isSelected = selected.includes(id)
            return (
              <button
                className={`genre-onboarding-card${isSelected ? ' selected' : ''}`}
                key={id}
                type="button"
                style={{ '--genre-color': color }}
                aria-pressed={isSelected}
                onClick={() => toggleGenre(id)}
              >
                <span className="genre-onboarding-icon">
                  <Icon size={23} aria-hidden="true" />
                </span>
                <span className="genre-onboarding-label">{label}</span>
                <span className="genre-onboarding-check" aria-hidden="true">
                  {isSelected && <Check size={13} />}
                </span>
              </button>
            )
          })}
        </section>

        {saveError && <p className="genre-onboarding-error" role="alert">{saveError}</p>}

        <footer className="genre-onboarding-footer">
          <button type="button" className="genre-onboarding-submit" onClick={handleContinue} disabled={isSaving}>
            <span>
              {isSaving
                ? 'Saving...'
                : selected.length > 0
                  ? `Continue with ${selected.length} Selected`
                  : 'Explore All Dramas'}
            </span>
            {!isSaving && <ArrowRight size={19} aria-hidden="true" />}
          </button>
        </footer>
      </div>
    </main>
  )
}