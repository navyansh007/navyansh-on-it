'use client'

const KEY = 'noi:session'

/**
 * Remember-me storage. What is kept is the server-signed token, never the
 * password itself, so a look at localStorage does not hand over the password.
 * Every wrapper swallows failures because private-mode browsers throw here.
 */
export function saveToken(token) {
  try {
    if (token) localStorage.setItem(KEY, token)
  } catch {
    /* storage blocked — the session simply lasts until reload */
  }
}

export function loadToken() {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* nothing to clear */
  }
}
