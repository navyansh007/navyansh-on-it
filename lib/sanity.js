import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const apiVersion = '2024-01-01'

/**
 * Read path.
 *
 * `useCdn` is off deliberately. Next's own ISR cache (revalidate: 60) is
 * already the caching layer, so Sanity's CDN adds no speed here — only a
 * second, independently stale copy. With it on, publishing revalidates the
 * Next cache and the refetch then re-caches whatever the CDN still had, so a
 * post could stay invisible for minutes after going live.
 */
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
})

// Same settings; named separately to make it explicit at the call site that
// these reads (composer back files, private journal) are never cached at all.
export const freshClient = client

// Write path. Only ever constructed on the server, and only when a token
// exists — `/write` degrades to a clear error rather than a crash without it.
export function getWriteClient() {
  const token = process.env.SANITY_WRITE_TOKEN
  if (!token) return null
  return createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
  })
}

const builder = imageUrlBuilder(client)
export function urlFor(source) {
  return builder.image(source)
}

export const PRIVATE_CATEGORY = 'Private'
export const PUBLIC_CATEGORY = 'Public'

/**
 * Visibility is carried by the `categories` references. A post is private only
 * if it is explicitly tagged so — untagged posts stay public, which is what
 * every entry written before this feature existed relies on.
 *
 * These predicates are applied inside the GROQ query rather than filtered in
 * JavaScript on purpose: a private post must never enter the page's HTML at
 * all, not merely be hidden once it is there.
 */
const IS_PRIVATE = `"${PRIVATE_CATEGORY}" in coalesce(categories[]->title, [])`
const IS_PUBLIC = `!(${IS_PRIVATE})`

const postFields = `
  _id,
  title,
  "slug": slug.current,
  publishedAt,
  _createdAt,
  _updatedAt,
  dek,
  "author": author->name,
  "categories": categories[]->title,
  mainImage,
  "plain": pt::text(body)
`

// Posts predate the `dek` field, so fall back to the opening of the body.
export function excerpt(post, length = 180) {
  const source = (post?.dek || post?.plain || '').trim()
  if (source.length <= length) return source
  const cut = source.slice(0, length)
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.]$/, '')}…`
}

const NEWEST_FIRST = 'order(coalesce(publishedAt, _createdAt) desc)'

/* --- public ------------------------------------------------------------- */

export async function getPosts() {
  return client.fetch(
    `*[_type == "post" && defined(slug.current) && ${IS_PUBLIC}]
      | ${NEWEST_FIRST} { ${postFields} }`,
    {},
    { next: { revalidate: 60 } }
  )
}

export async function getPost(slug) {
  return client.fetch(
    `*[_type == "post" && slug.current == $slug && ${IS_PUBLIC}][0]
      { ${postFields}, body }`,
    { slug },
    { next: { revalidate: 60 } }
  )
}

export async function getSlugs() {
  return client.fetch(
    `*[_type == "post" && defined(slug.current) && ${IS_PUBLIC}].slug.current`
  )
}

/* --- private (only ever reached through an authorised API route) --------- */

export async function getPrivatePosts() {
  return freshClient.fetch(
    `*[_type == "post" && ${IS_PRIVATE}] | ${NEWEST_FIRST} {
      _id, title, "slug": slug.current, publishedAt, dek,
      "plain": pt::text(body)
    }`
  )
}

export async function getPrivatePost(id) {
  return freshClient.fetch(
    `*[_type == "post" && _id == $id && ${IS_PRIVATE}][0] {
      _id, title, "slug": slug.current, publishedAt, dek, body
    }`,
    { id }
  )
}

/** Resolves the "Public"/"Private" category document so writes can tag a post. */
export async function getCategoryRef(title) {
  const id = await freshClient.fetch(
    `*[_type == "category" && title == $title][0]._id`,
    { title }
  )
  return id ? [{ _type: 'reference', _ref: id, _key: 'visibility' }] : []
}
