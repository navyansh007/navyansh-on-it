import { createHmac, timingSafeEqual } from 'node:crypto'

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

function equal(a, b) {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

/**
 * Constant-time check of the composer password. Returns false when no
 * ADMIN_PASSWORD is configured, so a missing env var locks the door rather
 * than leaving it open.
 */
export function checkPassword(candidate) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected || typeof candidate !== 'string') return false
  return equal(candidate, expected)
}

function sign(expiry, secret) {
  return createHmac('sha256', secret).update(String(expiry)).digest('hex')
}

/**
 * A remember-me token, so the password itself is never persisted in the
 * browser. It is signed with ADMIN_PASSWORD as the key, which means changing
 * the password immediately invalidates every token already issued.
 */
export function issueToken() {
  const secret = process.env.ADMIN_PASSWORD
  if (!secret) return null
  const expiry = Date.now() + TOKEN_TTL_MS
  return `${expiry}.${sign(expiry, secret)}`
}

export function checkToken(token) {
  const secret = process.env.ADMIN_PASSWORD
  if (!secret || typeof token !== 'string') return false

  const [expiryPart, mac] = token.split('.')
  const expiry = Number(expiryPart)
  if (!expiry || Number.isNaN(expiry) || Date.now() > expiry) return false
  if (!mac) return false

  return equal(mac, sign(expiry, secret))
}

/** Either a fresh password or a valid remember-me token gets you in. */
export function authorize(payload) {
  return checkPassword(payload?.password) || checkToken(payload?.token)
}
