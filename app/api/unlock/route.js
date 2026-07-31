import { NextResponse } from 'next/server'
import { authorize, checkToken, issueToken } from '../../../lib/auth'

export const runtime = 'nodejs'

/**
 * Trades a password for a remember-me token, or confirms a token already held.
 * Every protected route re-checks on its own, so a forged "unlocked" state in
 * the browser buys nothing.
 */
export async function POST(request) {
  let payload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 })
  }

  if (!authorize(payload)) {
    return NextResponse.json(
      { error: 'That password was not accepted.' },
      { status: 401 }
    )
  }

  return NextResponse.json({
    ok: true,
    // A still-valid token is handed straight back; a password mints a new one.
    token: checkToken(payload?.token) ? payload.token : issueToken(),
    canPublish: Boolean(process.env.SANITY_WRITE_TOKEN),
  })
}
