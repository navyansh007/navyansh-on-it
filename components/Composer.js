'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import slugify from 'slugify'
import { toPortableText, toManuscript } from '../lib/to-portable-text'
import { loadToken, saveToken, clearToken } from '../lib/session'
import PasswordField from './PasswordField'
import PostBody from './PostBody'

const DRAFT_KEY = 'noi:draft'

const BLANK = {
  title: '',
  dek: '',
  slug: '',
  body: '',
  publishedAt: '',
  visibility: 'public',
}

function localNow() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

/** Sanity stores UTC; <input type="datetime-local"> wants local wall time. */
function toLocalInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export default function Composer() {
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [token, setToken] = useState(null)
  const [unlocked, setUnlocked] = useState(false)
  const [canPublish, setCanPublish] = useState(true)
  const [checkingSession, setCheckingSession] = useState(true)

  // 'new' — a blank galley · 'pick' — choosing what to revise · 'edit' — revising
  const [mode, setMode] = useState('new')
  const [editing, setEditing] = useState(null)
  const [posts, setPosts] = useState([])
  const [loadingPosts, setLoadingPosts] = useState(false)

  const [draft, setDraft] = useState(BLANK)
  const [slugTouched, setSlugTouched] = useState(false)
  const [showProof, setShowProof] = useState(false)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [published, setPublished] = useState(null)

  /* --- session --------------------------------------------------------- */

  // A remembered token skips the password prompt entirely.
  useEffect(() => {
    const saved = loadToken()
    if (!saved) {
      setCheckingSession(false)
      return
    }
    ;(async () => {
      try {
        const res = await fetch('/api/unlock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: saved }),
        })
        const data = await res.json()
        if (res.ok) {
          setToken(saved)
          setUnlocked(true)
          setCanPublish(data.canPublish)
        } else {
          clearToken() // expired or invalidated by a password change
        }
      } catch {
        /* offline — fall back to the password prompt */
      } finally {
        setCheckingSession(false)
      }
    })()
  }, [])

  /* --- draft persistence ----------------------------------------------- */

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) setDraft({ ...BLANK, ...JSON.parse(saved) })
    } catch {
      /* corrupt draft — start clean */
    }
  }, [])

  useEffect(() => {
    // Revisions belong to Sanity, not to this browser's draft slot.
    if (mode === 'edit') return
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch {
      /* storage full or blocked — drafting still works in memory */
    }
  }, [draft, mode])

  const set = (field) => (event) => {
    const { value } = event.target
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  const derivedSlug = useMemo(() => {
    const source = slugTouched ? draft.slug : draft.title
    return slugify(source || '', { lower: true, strict: true }).slice(0, 90)
  }, [draft.slug, draft.title, slugTouched])

  const preview = useMemo(
    () => (showProof ? toPortableText(draft.body) : null),
    [showProof, draft.body]
  )

  const wordCount = draft.body.trim().split(/\s+/).filter(Boolean).length

  const loadPosts = useCallback(async () => {
    setLoadingPosts(true)
    setError('')
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not list entries.')
      setPosts(data.posts)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingPosts(false)
    }
  }, [token])

  async function unlock(event) {
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
      if (!res.ok) throw new Error(data.error || 'Could not unlock.')

      if (remember) saveToken(data.token)
      else clearToken()

      setToken(data.token)
      setUnlocked(true)
      setCanPublish(data.canPublish)
      setPassword('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function signOut() {
    clearToken()
    setToken(null)
    setUnlocked(false)
    setPosts([])
  }

  function startNew() {
    setMode('new')
    setEditing(null)
    setDraft(BLANK)
    setSlugTouched(false)
    setShowProof(false)
    setError('')
    setPublished(null)
  }

  function browse() {
    setMode('pick')
    setError('')
    setPublished(null)
    if (posts.length === 0) loadPosts()
  }

  async function openForEdit(id) {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not open that entry.')

      const { post } = data
      setDraft({
        title: post.title || '',
        dek: post.dek || '',
        slug: post.slug || '',
        body: toManuscript(post.body),
        publishedAt: toLocalInput(post.publishedAt),
        visibility: post.visibility || 'public',
      })
      setSlugTouched(true) // never silently rename an entry that is already live
      setEditing({ _id: post._id, title: post.title })
      setMode('edit')
      setShowProof(false)
      setPublished(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function publish(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setPublished(null)
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...draft,
          slug: derivedSlug,
          token,
          id: editing?._id,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'The press jammed.')

      setPublished(data)
      setPosts([]) // the list is stale now

      if (!data.revised) {
        setDraft(BLANK)
        setSlugTouched(false)
        setShowProof(false)
        try {
          localStorage.removeItem(DRAFT_KEY)
        } catch {
          /* nothing to clean up */
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  /* --- locked ---------------------------------------------------------- */

  if (checkingSession) {
    return (
      <div className="compose">
        <p style={{ fontStyle: 'italic', color: 'var(--ink-faint)' }}>
          Unlocking the composing room…
        </p>
      </div>
    )
  }

  if (!unlocked) {
    return (
      <form className="compose" onSubmit={unlock}>
        <header className="compose__head">
          <div className="kicker">Private</div>
          <h1 className="compose__title">The Composing Room</h1>
          <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--ink-soft)' }}>
            Identify yourself to set new type.
          </p>
        </header>

        {error ? <div className="notice notice--error">{error}</div> : null}

        <PasswordField
          label="Editor&rsquo;s password"
          value={password}
          onChange={setPassword}
          remember={remember}
          onRememberChange={setRemember}
          autoFocus
        />

        <button className="btn" type="submit" disabled={busy || !password}>
          {busy ? 'Checking…' : 'Enter'}
        </button>
      </form>
    )
  }

  const modeBar = (
    <div className="modebar" role="group" aria-label="Composer mode">
      <button
        type="button"
        className={mode === 'new' ? 'is-active' : ''}
        onClick={startNew}
      >
        Compose new
      </button>
      <button
        type="button"
        className={mode === 'pick' || mode === 'edit' ? 'is-active' : ''}
        onClick={browse}
      >
        Revise existing
      </button>
    </div>
  )

  /* --- choosing what to revise ----------------------------------------- */

  if (mode === 'pick') {
    return (
      <div className="compose">
        <header className="compose__head">
          <div className="kicker">Composing Room</div>
          <h1 className="compose__title">The Back Files</h1>
          <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--ink-soft)' }}>
            Choose an entry to reset.
          </p>
        </header>

        {modeBar}

        {error ? <div className="notice notice--error">{error}</div> : null}

        {loadingPosts ? (
          <p style={{ fontStyle: 'italic', color: 'var(--ink-faint)' }}>
            Fetching the back files…
          </p>
        ) : posts.length === 0 && !error ? (
          <p style={{ fontStyle: 'italic', color: 'var(--ink-faint)' }}>
            Nothing has been printed yet.
          </p>
        ) : (
          posts.map((post) => (
            <button
              type="button"
              className="picker"
              key={post._id}
              onClick={() => openForEdit(post._id)}
              disabled={busy}
            >
              <span className="picker__title">
                {post.title}
                {post.visibility === 'private' ? (
                  <span className="tag tag--private">Private</span>
                ) : null}
              </span>
              <span className="picker__slug">/{post.slug}</span>
            </button>
          ))
        )}
      </div>
    )
  }

  /* --- writing --------------------------------------------------------- */

  const revising = mode === 'edit'
  const isPrivate = draft.visibility === 'private'

  return (
    <form className="compose" onSubmit={publish}>
      <header className="compose__head">
        <div className="kicker">Composing Room</div>
        <h1 className="compose__title">
          {revising ? 'Reset an Entry' : 'Set New Type'}
        </h1>
        <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--ink-soft)' }}>
          {wordCount === 0
            ? 'A blank galley awaits.'
            : `${wordCount} ${wordCount === 1 ? 'word' : 'words'} on the stone.`}
        </p>
      </header>

      {modeBar}

      {revising ? (
        <div className="notice">
          Revising <strong>{editing.title}</strong>. Saving overwrites the live
          entry.
        </div>
      ) : null}

      {published ? (
        <div className="notice notice--ok">
          {published.revised ? 'Reset and saved.' : 'Printed.'}{' '}
          {published.private ? (
            <>Kept private — read it in your journal.</>
          ) : (
            <>
              Read it at{' '}
              <Link
                href={`/post/${published.slug}`}
                style={{ textDecoration: 'underline' }}
              >
                /post/{published.slug}
              </Link>
            </>
          )}
        </div>
      ) : null}

      {error ? <div className="notice notice--error">{error}</div> : null}

      {!canPublish ? (
        <div className="notice">
          <strong>The press has no ink.</strong> SANITY_WRITE_TOKEN is not set,
          so saving will fail. You can still write and preview — add the token
          to <code>.env.local</code> and restart the server.
        </div>
      ) : null}

      <div className="field">
        <label htmlFor="visibility">Edition</label>
        <div className="modebar modebar--inline">
          <button
            type="button"
            className={!isPrivate ? 'is-active' : ''}
            onClick={() =>
              setDraft((p) => ({ ...p, visibility: 'public' }))
            }
          >
            Public
          </button>
          <button
            type="button"
            className={isPrivate ? 'is-active' : ''}
            onClick={() =>
              setDraft((p) => ({ ...p, visibility: 'private' }))
            }
          >
            Private
          </button>
        </div>
        <p className="field__hint">
          {isPrivate
            ? 'Kept out of the paper entirely — readable only in your journal.'
            : 'Printed on the front page and in the archive.'}
        </p>
      </div>

      <div className="field field--headline">
        <label htmlFor="title">Headline</label>
        <input id="title" type="text" value={draft.title} onChange={set('title')} />
      </div>

      <div className="field">
        <label htmlFor="dek">Standfirst</label>
        <input
          id="dek"
          type="text"
          value={draft.dek}
          onChange={set('dek')}
          placeholder="One line beneath the headline. Optional."
        />
      </div>

      <div className="compose__row">
        <div className="field">
          <label htmlFor="slug">Slug</label>
          <input
            id="slug"
            type="text"
            value={slugTouched ? draft.slug : derivedSlug}
            onChange={(e) => {
              setSlugTouched(true)
              set('slug')(e)
            }}
          />
          <p className="field__hint">
            /post/{derivedSlug || '…'}
            {revising ? ' — changing this moves the entry' : ''}
          </p>
        </div>

        <div className="field">
          <label htmlFor="publishedAt">Dated</label>
          <input
            id="publishedAt"
            type="datetime-local"
            value={draft.publishedAt}
            onChange={set('publishedAt')}
          />
          <p className="field__hint">
            Left blank, it prints as {localNow().replace('T', ' ')}.
          </p>
        </div>
      </div>

      <div className="field field--manuscript">
        <label htmlFor="body">Manuscript</label>
        <textarea id="body" value={draft.body} onChange={set('body')} />
        <p className="field__hint">
          Blank line for a new paragraph. <code>## Heading</code>,{' '}
          <code>&gt; quote</code>, <code>- list</code>, <code>1. list</code>,{' '}
          <code>**bold**</code>, <code>*italic*</code>, <code>`code`</code>,{' '}
          <code>[text](url)</code>.
        </p>
      </div>

      <div className="compose__actions">
        <button
          className="btn"
          type="submit"
          disabled={busy || !draft.title || !draft.body}
        >
          {busy
            ? 'Printing…'
            : revising
              ? 'Save revisions'
              : isPrivate
                ? 'Keep it private'
                : 'Print it'}
        </button>
        <button
          className="btn btn--ghost"
          type="button"
          onClick={() => setShowProof((v) => !v)}
        >
          {showProof ? 'Hide proof' : 'Read proof'}
        </button>
        <button className="btn btn--ghost" type="button" onClick={signOut}>
          Sign out
        </button>
      </div>

      {showProof ? (
        <div className="galley">
          <div className="galley__label">Galley Proof</div>
          <h2
            className="article__title"
            style={{ fontSize: '2rem', textAlign: 'center' }}
          >
            {draft.title || 'Untitled'}
          </h2>
          {draft.dek ? (
            <p className="article__dek" style={{ textAlign: 'center' }}>
              {draft.dek}
            </p>
          ) : null}
          <PostBody value={preview} />
        </div>
      ) : null}
    </form>
  )
}
