import { NextResponse } from 'next/server'
import { getPrivatePosts, getPrivatePost } from '../../../lib/sanity'
import { authorize } from '../../../lib/auth'

export const runtime = 'nodejs'

/**
 * The private journal. Nothing here is ever rendered into a public page, so
 * this route is the only way private entries leave the server.
 *
 *   { password | token }        -> every private entry, newest first
 *   { password | token, id }    -> one entry, with its body
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
      const post = await getPrivatePost(payload.id)
      if (!post) {
        return NextResponse.json({ error: 'No such entry.' }, { status: 404 })
      }
      return NextResponse.json({ post })
    }

    return NextResponse.json({ posts: await getPrivatePosts() })
  } catch (error) {
    return NextResponse.json(
      { error: `Could not reach Sanity: ${error?.message || 'unknown error'}` },
      { status: 502 }
    )
  }
}
