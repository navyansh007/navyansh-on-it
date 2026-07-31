import { PortableText } from '@portabletext/react'
import { urlFor } from '../lib/sanity'

const components = {
  types: {
    image: ({ value }) => {
      if (!value?.asset) return null
      return (
        <figure>
          <img
            src={urlFor(value).width(1200).auto('format').url()}
            alt={value.alt || ''}
            loading="lazy"
          />
          {value.caption ? <figcaption>{value.caption}</figcaption> : null}
        </figure>
      )
    },
  },

  block: {
    h1: ({ children }) => <h2>{children}</h2>, // the article title is the only h1
    h2: ({ children }) => <h2>{children}</h2>,
    h3: ({ children }) => <h3>{children}</h3>,
    h4: ({ children }) => <h4>{children}</h4>,
    blockquote: ({ children }) => <blockquote>{children}</blockquote>,
    normal: ({ children }) => <p>{children}</p>,
  },

  marks: {
    link: ({ value, children }) => {
      const href = value?.href || ''
      const external = /^https?:\/\//.test(href)
      return (
        <a
          href={href}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {children}
        </a>
      )
    },
    code: ({ children }) => <code>{children}</code>,
  },

  list: {
    bullet: ({ children }) => <ul>{children}</ul>,
    number: ({ children }) => <ol>{children}</ol>,
  },
}

export default function PostBody({ value }) {
  if (!Array.isArray(value) || value.length === 0) return null
  return (
    <div className="prose">
      <PortableText value={value} components={components} />
    </div>
  )
}
