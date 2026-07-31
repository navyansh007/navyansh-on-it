import Link from 'next/link'
import { getPosts, excerpt } from '../lib/sanity'
import { postDate, longDate, readingTime } from '../lib/dates'

export const revalidate = 60

const FRONT_PAGE_STORIES = 9

export default async function FrontPage() {
  const posts = await getPosts()

  if (posts.length === 0) {
    return (
      <div className="page plate">
        <div className="kicker">Press Notice</div>
        <h2 className="plate__title">The presses are warm</h2>
        <p>Nothing has been set in type yet. Check back shortly.</p>
      </div>
    )
  }

  const [lead, ...rest] = posts
  const stories = rest.slice(0, FRONT_PAGE_STORIES)
  const hasMore = rest.length > stories.length

  return (
    <div className="page front">
      <article className="lead">
        <div className="kicker lead__kicker">Leading Article</div>
        <h2 className="lead__title">
          <Link href={`/post/${lead.slug}`}>{lead.title}</Link>
        </h2>
        <p className="lead__dek">{excerpt(lead, 240)}</p>
        <div className="lead__meta">
          {longDate(postDate(lead))}
          {lead.author ? ` · By ${lead.author}` : ''}
          {readingTime(lead.plain) ? ` · ${readingTime(lead.plain)}` : ''}
        </div>
      </article>

      {stories.length > 0 && (
        <div className="columns">
          {stories.map((post, index) => (
            <Link className="story" href={`/post/${post.slug}`} key={post._id}>
              <span className="story__number">
                {String(index + 2).padStart(2, '0')}
              </span>
              <h3 className="story__title">{post.title}</h3>
              <p className="story__dek">{excerpt(post, 150)}</p>
              <div className="story__meta">
                <span>
                  {longDate(postDate(post))}
                  {readingTime(post.plain) ? ` · ${readingTime(post.plain)}` : ''}
                </span>
                <span className="story__read">Read →</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="front__more">
          <div className="kicker">Continued Inside</div>
          <p style={{ margin: '0.75rem 0 0' }}>
            <Link
              href="/archive"
              style={{ borderBottom: '1px solid var(--rule)' }}
            >
              The complete archive of {posts.length} entries
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}
