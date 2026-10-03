import { DRAMA_PERSONAS } from '../data/dramaPersonas.js'

export default function DramaPersonaAvatar({
  personaId,
  color = '#F5A9C4',
  className = '',
  iconSize = 22,
}) {
  const PersonaIcon = DRAMA_PERSONAS.find(({ id }) => id === personaId)?.Icon || DRAMA_PERSONAS[0].Icon

  return (
    <span
      className={`drama-persona-avatar ${className}`.trim()}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      <PersonaIcon size={iconSize} strokeWidth={2.2} />
    </span>
  )
}
