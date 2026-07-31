import { NextResponse } from 'next/server'
import { freshClient, PRIVATE_CATEGORY } from '../../../lib/sanity'
import { authorize } from '../../../lib/auth'

export const runtime = 'nodejs'

const VISIBILITY = `"visibility": select(
  "${PRIVATE_CATEGORY}" in coalesce(categories[]->title, []) => "private",
  "public"
)`

/**
 * Backs the composer's "revise an existing entry" mode. Covers public and
 * private entries alike — this route is already behind the editor's password.
 *
 *   { auth }        -> every post, newest first
 *   { auth, id }    -> one post, including its body for editing
 */
export async function POST(request) {
  let payload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Malformed request.' }, { status: 400 })
  }

  if (!authorize(payload)) {
    return NextResponse.json({ error: 'Not authorised.' }, { status: 401 })
  }

  try {
    if (payload.id) {
      const post = await freshClient.fetch(
        `*[_type == "post" && _id == $id][0]{
          _id, title, dek, "slug": slug.current, publishedAt, body, ${VISIBILITY}
        }`,
        { id: payload.id }
      )
      if (!post) {
        return NextResponse.json({ error: 'No such entry.' }, { status: 404 })
      }
      return NextResponse.json({ post })
    }

    const posts = await freshClient.fetch(
      `*[_type == "post" && defined(slug.current)]
        | order(coalesce(publishedAt, _createdAt) desc){
          _id, title, "slug": slug.current, publishedAt, ${VISIBILITY}
        }`
    )
    return NextResponse.json({ posts })
  } catch (error) {
    return NextResponse.json(
      { error: `Could not reach Sanity: ${error?.message || 'unknown error'}` },
      { status: 502 }
    )
  }
}
