'use client'

import { useId, useState } from 'react'

/**
 * Password input with a reveal toggle and an optional remember-me checkbox.
 * Revealing is a genuine convenience on a long admin password typed on a
 * phone, and there is no shoulder-surfing risk the owner cannot judge.
 */
export default function PasswordField({
  value,
  onChange,
  label = 'Password',
  hint,
  remember,
  onRememberChange,
  autoFocus = false,
}) {
  const id = useId()
  const [shown, setShown] = useState(false)

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>

      <div className="password">
        <input
          id={id}
          type={shown ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
          autoComplete="current-password"
        />
        <button
          type="button"
          className="password__reveal"
          onClick={() => setShown((v) => !v)}
          aria-pressed={shown}
          aria-label={shown ? 'Hide password' : 'Show password'}
        >
          {shown ? 'Hide' : 'Show'}
        </button>
      </div>

      {onRememberChange ? (
        <label className="check">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => onRememberChange(e.target.checked)}
          />
          <span>Remember me on this device for 30 days</span>
        </label>
      ) : null}

      {hint ? <p className="field__hint">{hint}</p> : null}
    </div>
  )
}
