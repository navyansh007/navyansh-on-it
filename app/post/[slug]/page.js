import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPost, getSlugs, urlFor, excerpt } from '../../../lib/sanity'
import { postDate, longDate, readingTime } from '../../../lib/dates'
import PostBody from '../../../components/PostBody'

export const revalidate = 60

export async function generateStaticParams() {
  const slugs = await getSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: 'Not Found' }

  return {
    title: post.title,
    description: excerpt(post, 160),
    openGraph: {
      title: post.title,
      description: excerpt(post, 160),
      type: 'article',
      publishedTime: post.publishedAt,
      images: post.mainImage
        ? [urlFor(post.mainImage).width(1200).height(630).url()]
        : undefined,
    },
  }
}

export default async function PostPage({ params }) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) notFound()

  const published = postDate(post)
  const updated = post._updatedAt
  const wasRevised =
    updated && published && new Date(updated) - new Date(published) > 86_400_000

  return (
    <div className="page article">
      <header className="article__head">
        <div className="kicker">
          {post.categories?.length ? post.categories.join(' · ') : 'Dispatch'}
        </div>

        <h1 className="article__title">{post.title}</h1>

        {post.dek ? <p className="article__dek">{post.dek}</p> : null}

        <div className="article__byline">
          <span>By {post.author || 'Navyansh Kesarwani'}</span>
          <span>{longDate(published)}</span>
          {readingTime(post.plain) ? <span>{readingTime(post.plain)}</span> : null}
        </div>
      </header>

      {post.mainImage ? (
        <figure className="article__figure">
          <img
            src={urlFor(post.mainImage).width(1400).auto('format').url()}
            alt={post.mainImage.alt || post.title}
          />
          {post.mainImage.caption ? (
            <figcaption>{post.mainImage.caption}</figcaption>
          ) : null}
        </figure>
      ) : null}

      <PostBody value={post.body} />

      <div className="dinkus">❧</div>

      <footer className="article__foot">
        <span>
          {wasRevised ? `Revised ${longDate(updated)}` : `Set in type ${longDate(published)}`}
        </span>
        <Link href="/archive" style={{ borderBottom: '1px solid var(--rule)' }}>
          Back to the archive
        </Link>
      </footer>
    </div>
  )
}
