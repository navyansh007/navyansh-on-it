'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import PasswordField from './PasswordField'
import PostBody from './PostBody'
import { loadToken, saveToken, clearToken } from '../lib/session'
import { longDate } from '../lib/dates'

/**
 * The private journal.
 *
 * Three ways in, none of them advertised, none of them a page of its own:
 * private entries are fetched from an authorised API and rendered into this
 * overlay, so they never appear in any page's HTML, sitemap or build output.
 *
 * - Type the word below anywhere on the site. A typed sequence rather than a
 *   modifier chord because every obvious chord (Ctrl+Shift+J/K/I) is already
 *   taken by a browser's devtools. No use on a phone, hence the other two.
 * - Press and hold the masthead nameplate. Works with a finger.
 * - Load any page with the fragment below — bookmark it, or keep it on the
 *   home screen. A fragment never reaches the server and is wiped from the
 *   address bar the moment it is read, so it leaves nothing behind.
 */
const SECRET = 'journal'
const FRAGMENT = '#journal'
const HOLD_MS = 650

// How far a finger may drift before the hold is read as a scroll instead.
const HOLD_SLOP = 10

export default function Journal() {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [unlocked, setUnlocked] = useState(false)

  const [posts, setPosts] = useState([])
  const [reading, setReading] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const buffer = useRef('')

  // Set by a hold that opened the journal, read by the click that follows it.
  // A ref, not a local: opening re-runs the effect below, which would take a
  // local flag down with it before the click ever arrived.
  const held = useRef(false)

  const load = useCallback(async (auth) => {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auth),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not open the journal.')

      setPosts(data.posts)
      setUnlocked(true)
      setPassword('')
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setBusy(false)
    }
  }, [])

  /* --- the hidden trigger ---------------------------------------------- */

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape' && open) {
        setOpen(false)
        return
      }

      // Never sniff keystrokes meant for a field the user is typing into.
      const el = event.target
      const typing =
        el instanceof HTMLElement &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.isContentEditable)
      if (typing || open || event.metaKey || event.ctrlKey || event.altKey) return

      if (event.key.length !== 1) return
      buffer.current = (buffer.current + event.key.toLowerCase()).slice(
        -SECRET.length
      )

      if (buffer.current === SECRET) {
        // Swallow the final keystroke, or it lands in the password field that
        // is about to take focus.
        event.preventDefault()
        buffer.current = ''
        setPassword('')
        setOpen(true)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  /* --- the same door, for a thumb ---------------------------------------- */

  useEffect(() => {
    let timer = null
    let start = null

    function cancel() {
      clearTimeout(timer)
      timer = null
      start = null
    }

    function onPointerDown(event) {
      held.current = false
      if (open) return
      if (event.pointerType === 'mouse' && event.button !== 0) return
      if (!event.target.closest?.('[data-journal-hold]')) return

      start = { x: event.clientX, y: event.clientY }
      timer = setTimeout(() => {
        timer = null
        held.current = true
        setPassword('')
        setOpen(true)
      }, HOLD_MS)
    }

    function onPointerMove(event) {
      if (!start) return
      const drift = Math.hypot(event.clientX - start.x, event.clientY - start.y)
      if (drift > HOLD_SLOP) cancel()
    }

    // The nameplate is a link home; a hold that opened the journal must not
    // navigate as well.
    function onClick(event) {
      if (!held.current) return
      held.current = false
      event.preventDefault()
      event.stopPropagation()
    }

    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', cancel)
    window.addEventListener('pointercancel', cancel)
    window.addEventListener('scroll', cancel, true)
    // Capture, so the suppressed click never reaches the link's own handler.
    window.addEventListener('click', onClick, true)

    return () => {
      cancel()
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', cancel)
      window.removeEventListener('pointercancel', cancel)
      window.removeEventListener('scroll', cancel, true)
      window.removeEventListener('click', onClick, true)
    }
  }, [open])

  /* --- the same door, from a bookmark ------------------------------------ */

  useEffect(() => {
    function read() {
      if (window.location.hash.toLowerCase() !== FRAGMENT) return

      // Wipe it before opening: the address bar keeps no trace, and a stray
      // share or screenshot of the URL gives nothing away.
      window.history.replaceState(
        null,
        '',
        window.location.pathname + window.location.search
      )
      setPassword('')
      setOpen(true)
    }

    read()
    window.addEventListener('hashchange', read)
    return () => window.removeEventListener('hashchange', read)
  }, [])

  // A remembered token means the password prompt is skipped entirely.
  useEffect(() => {
    if (!open || unlocked) return
    const token = loadToken()
    if (token) load({ token })
  }, [open, unlocked, load])

  // Hold the page still while the overlay is up.
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  if (!open) return null

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'That password was refused.')

      if (remember) saveToken(data.token)
      else clearToken()

      await load({ token: data.token })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  async function openEntry(id) {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: loadToken(), id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not open that entry.')
      setReading(data.post)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function lock() {
    clearToken()
    setUnlocked(false)
    setPosts([])
    setReading(null)
    setPassword('')
    setOpen(false)
  }

  return (
    <div
      className="vault"
      role="dialog"
      aria-modal="true"
      aria-label="Private journal"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false)
      }}
    >
      <div className="vault__sheet">
        <div className="vault__bar">
          <span className="kicker">Private Journal</span>
          <div className="vault__tools">
            {unlocked ? (
              <button type="button" className="vault__tool" onClick={lock}>
                Lock
              </button>
            ) : null}
            <button
              type="button"
              className="vault__tool"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              Close
            </button>
          </div>
        </div>

        <div className="vault__body">
          {error ? <div className="notice notice--error">{error}</div> : null}

          {!unlocked ? (
            <form onSubmit={submit}>
              <h2 className="vault__title">Under Lock</h2>
              <p className="vault__sub">
                These pages are not for the paper. Give the word.
              </p>
              <PasswordField
                label="Editor&rsquo;s password"
                value={password}
                onChange={setPassword}
                remember={remember}
                onRememberChange={setRemember}
                autoFocus
              />
              <button className="btn" type="submit" disabled={busy || !password}>
                {busy ? 'Checking…' : 'Unlock'}
              </button>
            </form>
          ) : reading ? (
            <article>
              <button
                type="button"
                className="vault__back"
                onClick={() => setReading(null)}
              >
                ← All entries
              </button>
              <h2 className="vault__title">{reading.title}</h2>
              <p className="vault__sub">{longDate(reading.publishedAt)}</p>
              {reading.dek ? (
                <p className="article__dek" style={{ textAlign: 'left' }}>
                  {reading.dek}
                </p>
              ) : null}
              <PostBody value={reading.body} />
            </article>
          ) : (
            <>
              <h2 className="vault__title">Your Journal</h2>
              <p className="vault__sub">
                {posts.length} private{' '}
                {posts.length === 1 ? 'entry' : 'entries'}, newest first.
              </p>

              {busy ? (
                <p className="vault__sub">Opening the drawer…</p>
              ) : posts.length === 0 ? (
                <p className="vault__sub">
                  Nothing here yet. Write one in the composing room and mark it
                  private.
                </p>
              ) : (
                posts.map((post) => (
                  <button
                    type="button"
                    className="picker"
                    key={post._id}
                    onClick={() => openEntry(post._id)}
                  >
                    <span className="picker__title">{post.title}</span>
                    <span className="picker__slug">
                      {longDate(post.publishedAt)}
                    </span>
                  </button>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
