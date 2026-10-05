import React from 'react'
import { Circle, CheckCircle2, ShieldCheck } from 'lucide-react'
import { PASSWORD_REQUIREMENTS, getPasswordStrength } from '../utils/passwordRequirements.js'

export default function PasswordRequirementsList({
  password = '',
  currentPassword = null,
  isChangePassword = false,
}) {
  const pwd = password || ''
  const strength = getPasswordStrength(pwd)

  return (
    <div className="pwd-requirements-container" role="region" aria-label="Password requirements">
      {/* 4-Segment Strength Meter */}
      <div className="pwd-strength-container">
        <div className={`pwd-strength-segments ${strength.key}`} aria-hidden="true">
          {[1, 2, 3, 4].map((seg) => (
            <div
              key={seg}
              className={`pwd-strength-segment ${seg <= strength.score ? 'active' : ''}`}
            />
          ))}
        </div>
        <span className={`pwd-strength-label ${strength.key}`} aria-live="polite">
          {strength.label}
        </span>
      </div>

      {/* Compact Checklist (no box, no border) */}
      <ul className="pwd-requirements-checklist">
        {PASSWORD_REQUIREMENTS.map((req) => {
          const isMet = req.test(pwd)
          return (
            <li
              key={req.id}
              className={`pwd-requirement-item ${isMet ? 'met' : 'unmet'}`}
            >
              {isMet ? (
                <CheckCircle2 size={14} className="pwd-req-icon met" aria-hidden="true" />
              ) : (
                <Circle size={14} className="pwd-req-icon unmet" aria-hidden="true" />
              )}
              <span className="pwd-req-label">{req.label}</span>
            </li>
          )
        })}

        {/* Different from current password (when changing password in modal) */}
        {isChangePassword && currentPassword !== null && (
          <li
            key="different"
            className={`pwd-requirement-item ${
              pwd.length > 0 && currentPassword.length > 0 && pwd !== currentPassword ? 'met' : 'unmet'
            }`}
          >
            {pwd.length > 0 && currentPassword.length > 0 && pwd !== currentPassword ? (
              <CheckCircle2 size={14} className="pwd-req-icon met" aria-hidden="true" />
            ) : (
              <Circle size={14} className="pwd-req-icon unmet" aria-hidden="true" />
            )}
            <span className="pwd-req-label">Different from current password</span>
          </li>
        )}
      </ul>

      {/* Breach check indicator */}
      <div className="pwd-breach-notice">
        <ShieldCheck size={14} className="pwd-breach-icon" aria-hidden="true" />
        <span>Checked against known data breaches</span>
      </div>
    </div>
  )
}
