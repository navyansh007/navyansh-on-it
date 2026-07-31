/**
 * Converts the composer's plain-text manuscript into Sanity Portable Text.
 *
 * Deliberately a small subset — the amount of markup a person actually reaches
 * for while writing prose:
 *
 *   ## Heading            h2 (through #### for h4; a lone # is also h2,
 *                         because the article title owns the only h1)
 *   > Quotation           blockquote
 *   - Item / 1. Item      bullet and numbered lists
 *   blank line            paragraph break
 *   **bold**  *italic*  `code`  [text](https://url)
 *
 * Runs identically on the server (publishing) and in the browser (the galley
 * proof), so what the composer previews is exactly what gets stored.
 */

function key() {
  return Math.random().toString(36).slice(2, 14)
}

const INLINE =
  /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)\s]+)\))/g

function parseInline(text, markDefs) {
  const spans = []
  const push = (value, marks) => {
    if (value) spans.push({ _type: 'span', _key: key(), text: value, marks })
  }

  let last = 0
  let match
  INLINE.lastIndex = 0

  while ((match = INLINE.exec(text)) !== null) {
    if (match.index > last) push(text.slice(last, match.index), [])

    if (match[1]) push(match[2], ['strong'])
    else if (match[3]) push(match[4], ['em'])
    else if (match[5]) push(match[6], ['code'])
    else if (match[7]) {
      const linkKey = key()
      markDefs.push({ _key: linkKey, _type: 'link', href: match[9] })
      push(match[8], [linkKey])
    }

    last = INLINE.lastIndex
  }

  if (last < text.length) push(text.slice(last), [])
  if (spans.length === 0) push(text || '', [])

  return spans
}

function block(text, style = 'normal', listItem) {
  const markDefs = []
  const children = parseInline(text, markDefs)
  return {
    _type: 'block',
    _key: key(),
    style,
    markDefs,
    children,
    ...(listItem ? { listItem, level: 1 } : {}),
  }
}

export function toPortableText(source) {
  const lines = String(source || '')
    .replace(/\r\n/g, '\n')
    .split('\n')

  const blocks = []
  let paragraph = []

  const flush = () => {
    if (paragraph.length) {
      blocks.push(block(paragraph.join(' ')))
      paragraph = []
    }
  }

  for (const raw of lines) {
    const line = raw.trim()

    if (!line) {
      flush()
      continue
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/)
    if (heading) {
      flush()
      const level = Math.min(4, Math.max(2, heading[1].length))
      blocks.push(block(heading[2], `h${level}`))
      continue
    }

    if (/^([-*_])\1{2,}$/.test(line)) {
      flush() // horizontal rules have no Portable Text equivalent here
      continue
    }

    const quote = line.match(/^>\s?(.*)$/)
    if (quote) {
      flush()
      blocks.push(block(quote[1], 'blockquote'))
      continue
    }

    const bullet = line.match(/^[-*•]\s+(.+)$/)
    if (bullet) {
      flush()
      blocks.push(block(bullet[1], 'normal', 'bullet'))
      continue
    }

    const numbered = line.match(/^\d+[.)]\s+(.+)$/)
    if (numbered) {
      flush()
      blocks.push(block(numbered[1], 'normal', 'number'))
      continue
    }

    paragraph.push(line)
  }

  flush()
  return blocks
}

/** Reverse direction, so an existing post can be loaded back for editing. */
export function toManuscript(blocks) {
  if (!Array.isArray(blocks)) return ''

  return blocks
    .map((b) => {
      if (b._type !== 'block') return ''

      const text = (b.children || [])
        .map((span) => {
          let out = span.text || ''
          const marks = span.marks || []
          const linkDef = marks
            .map((m) => (b.markDefs || []).find((d) => d._key === m))
            .find(Boolean)

          if (marks.includes('code')) out = `\`${out}\``
          if (marks.includes('em')) out = `*${out}*`
          if (marks.includes('strong')) out = `**${out}**`
          if (linkDef?.href) out = `[${out}](${linkDef.href})`
          return out
        })
        .join('')

      if (b.listItem === 'bullet') return `- ${text}`
      if (b.listItem === 'number') return `1. ${text}`
      if (b.style === 'blockquote') return `> ${text}`
      if (/^h[1-4]$/.test(b.style || '')) {
        return `${'#'.repeat(Number(b.style.slice(1)))} ${text}`
      }
      return text
    })
    .filter(Boolean)
    .join('\n\n')
}
