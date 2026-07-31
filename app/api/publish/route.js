import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import slugify from 'slugify'
import {
  client,
  getWriteClient,
  getCategoryRef,
  PRIVATE_CATEGORY,
  PUBLIC_CATEGORY,
} from '../../../lib/sanity'
import { toPortableText } from '../../../lib/to-portable-text'
import { authorize } from '../../../lib/auth'

export const runtime = 'nodejs'

function fail(message, status) {
  return NextResponse.json({ error: message }, { status })
}

/**
 * Appends -2, -3 … until the slug is free, so publishing never overwrites.
 * `selfId` exempts the document being revised from colliding with itself.
 */
async function uniqueSlug(base, selfId) {
  let candidate = base
  for (let n = 2; n < 100; n += 1) {
    const taken = await client.fetch(
      `count(*[_type == "post" && slug.current == $slug && _id != $selfId]) > 0`,
      { slug: candidate, selfId: selfId || '-' }
    )
    if (!taken) return candidate
    candidate = `${base}-${n}`
  }
  return `${base}-${Date.now()}`
}

export async function POST(request) {
  let payload
  try {
    payload = await request.json()
  } catch {
    return fail('Malformed request.', 400)
  }

  const { title, dek, slug, body, publishedAt, id, visibility } = payload

  if (!authorize(payload)) {
    return fail('Not authorised.', 401)
  }

  if (!title?.trim()) return fail('A headline is required.', 422)
  if (!body?.trim()) return fail('The manuscript is empty.', 422)

  const write = getWriteClient()
  if (!write) {
    return fail(
      'No SANITY_WRITE_TOKEN is configured, so the press cannot run. Add one to .env.local and restart.',
      503
    )
  }

  const base =
    slugify(slug?.trim() || title, { lower: true, strict: true }).slice(0, 90) ||
    `entry-${Date.now()}`

  try {
    const finalSlug = await uniqueSlug(base, id)
    const isPrivate = visibility === 'private'

    const fields = {
      title: title.trim(),
      slug: { _type: 'slug', current: finalSlug },
      publishedAt: publishedAt
        ? new Date(publishedAt).toISOString()
        : new Date().toISOString(),
      body: toPortableText(body),
      categories: await getCategoryRef(
        isPrivate ? PRIVATE_CATEGORY : PUBLIC_CATEGORY
      ),
    }

    let saved
    let previousSlug

    if (id) {
      // Revision. Read the old slug first so its cached page is invalidated
      // too, otherwise a renamed entry lingers at its former address.
      previousSlug = await client.fetch(
        `*[_id == $id][0].slug.current`,
        { id }
      )

      const patch = write.patch(id).set(fields)
      saved = await (dek?.trim()
        ? patch.set({ dek: dek.trim() })
        : patch.unset(['dek'])
      ).commit()
    } else {
      saved = await write.create({
        _type: 'post',
        ...fields,
        ...(dek?.trim() ? { dek: dek.trim() } : {}),
      })
    }

    // Push the change onto the cached front page and archive immediately.
    revalidatePath('/')
    revalidatePath('/archive')
    revalidatePath(`/post/${finalSlug}`)
    if (previousSlug && previousSlug !== finalSlug) {
      revalidatePath(`/post/${previousSlug}`)
    }

    return NextResponse.json({
      id: saved._id,
      slug: finalSlug,
      revised: Boolean(id),
      private: isPrivate,
    })
  } catch (error) {
    const message = error?.message || 'Unknown error'
    const isAuth = /permission|unauthorized|token/i.test(message)
    return fail(
      isAuth
        ? 'Sanity rejected the token. It needs Editor permissions on the production dataset.'
        : `Sanity refused the document: ${message}`,
      isAuth ? 403 : 502
    )
  }
}
