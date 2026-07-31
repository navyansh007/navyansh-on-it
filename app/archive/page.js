import Link from 'next/link'
import { getPosts } from '../../lib/sanity'
import { postDate, shortDate, year } from '../../lib/dates'

export const revalidate = 60

export const metadata = {
  title: 'Archive',
  description: 'Every entry ever set in type, listed by year.',
}

export default async function ArchivePage() {
  const posts = await getPosts()

  // Group by year, preserving the newest-first order the query already gives.
  const byYear = posts.reduce((acc, post) => {
    const y = year(postDate(post)) ?? 'Undated'
    ;(acc[y] ||= []).push(post)
    return acc
  }, {})

  const years = Object.keys(byYear).sort((a, b) => b - a)

  return (
    <div className="page archive">
      <header className="archive__head">
        <div className="kicker">Bound Volumes</div>
        <h1 className="archive__title">The Complete Archive</h1>
        <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--ink-soft)' }}>
          {posts.length} {posts.length === 1 ? 'entry' : 'entries'}, newest first.
        </p>
      </header>

      {years.length === 0 ? (
        <p style={{ textAlign: 'center', fontStyle: 'italic' }}>
          The archive is empty for now.
        </p>
      ) : (
        years.map((y) => (
          <section key={y}>
            <h2 className="archive__year">{y}</h2>
            {byYear[y].map((post) => (
              <Link className="entry" href={`/post/${post.slug}`} key={post._id}>
                <span className="entry__title">{post.title}</span>
                <span className="entry__leader" aria-hidden="true" />
                <span className="entry__date">{shortDate(postDate(post))}</span>
              </Link>
            ))}
          </section>
        ))
      )}
    </div>
  )
}
