import { format, formatDistanceToNowStrict, parseISO } from 'date-fns'

function toDate(value) {
  if (!value) return null
  const date = typeof value === 'string' ? parseISO(value) : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** The date a post claims — `publishedAt` if set, otherwise its creation. */
export function postDate(post) {
  return toDate(post?.publishedAt) || toDate(post?._createdAt)
}

export function longDate(value) {
  const date = toDate(value)
  return date ? format(date, 'd MMMM yyyy') : ''
}

export function shortDate(value) {
  const date = toDate(value)
  return date ? format(date, 'd MMM yyyy') : ''
}

export function year(value) {
  const date = toDate(value)
  return date ? date.getFullYear() : null
}

export function relative(value) {
  const date = toDate(value)
  return date ? `${formatDistanceToNowStrict(date)} ago` : ''
}

/** Rough reading time, at the usual 200 words a minute. */
export function readingTime(text) {
  const words = (text || '').trim().split(/\s+/).filter(Boolean).length
  if (!words) return null
  return `${Math.max(1, Math.round(words / 200))} min read`
}
