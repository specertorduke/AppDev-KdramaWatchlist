export const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: '8+ characters', test: (pwd) => (pwd || '').length >= 8 },
  { id: 'uppercase', label: 'Uppercase letter', test: (pwd) => /[A-Z]/.test(pwd || '') },
  { id: 'lowercase', label: 'Lowercase letter', test: (pwd) => /[a-z]/.test(pwd || '') },
  { id: 'number', label: 'Number', test: (pwd) => /[0-9]/.test(pwd || '') },
  { id: 'symbol', label: 'Symbol', test: (pwd) => /[^A-Za-z0-9]/.test(pwd || '') },
]

export function getPasswordStrength(password = '') {
  const pwd = password || ''
  if (!pwd) {
    return { score: 0, label: 'Empty', key: 'empty' }
  }

  const metCount = PASSWORD_REQUIREMENTS.filter((req) => req.test(pwd)).length
  if (metCount === 0) {
    return { score: 0, label: 'Empty', key: 'empty' }
  }

  // If length is under 8, cap at Weak
  if (pwd.length < 8) {
    return { score: 1, label: 'Weak', key: 'weak' }
  }

  // 1-2 = Weak, 3 = Fair, 4 = Good, all 5 = Strong
  if (metCount <= 2) {
    return { score: 1, label: 'Weak', key: 'weak' }
  }
  if (metCount === 3) {
    return { score: 2, label: 'Fair', key: 'fair' }
  }
  if (metCount === 4) {
    return { score: 3, label: 'Good', key: 'good' }
  }
  return { score: 4, label: 'Strong', key: 'strong' }
}

export function checkPasswordRequirements(password, confirmation = null, currentPassword = null) {
  const pwd = password || ''
  const items = PASSWORD_REQUIREMENTS.map((req) => ({
    ...req,
    met: req.test(pwd),
  }))

  const allRulesMet = items.every((item) => item.met)
  const isMatch = confirmation !== null ? pwd.length > 0 && pwd === confirmation : null
  const isDifferent = currentPassword !== null ? pwd.length > 0 && currentPassword.length > 0 && pwd !== currentPassword : null

  return {
    items,
    allRulesMet,
    isMatch,
    isDifferent,
    isValid: allRulesMet && (isMatch === null || isMatch) && (isDifferent === null || isDifferent),
  }
}
