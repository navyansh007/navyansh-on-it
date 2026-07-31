# Navyansh On It

A personal blogging and journalling platform set as a vintage broadsheet
newspaper. Content lives in Sanity; posts are written, revised and published
from the site itself.

Next.js 15 (App Router) · React 19 · Sanity.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

`npm run build` then `npm start` for the production build.

## Environment

All configuration and secrets live in `.env`, which is git-ignored.
`.env.example` is the committed reference — copy it and fill it in:

```bash
cp .env.example .env
```

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity dataset |
| `SANITY_WRITE_TOKEN` | Editor-permission token; without it publishing fails with a clear notice |
| `ADMIN_PASSWORD` | Unlocks the composer and the private journal |

### Deploying to Vercel

`.env` is never committed, so set the same four keys under
**Project Settings → Environment Variables**. `SANITY_WRITE_TOKEN` and
`ADMIN_PASSWORD` must not be given the `NEXT_PUBLIC_` prefix — that prefix
inlines a value into the client bundle, which for these would publish them.

## Public and private entries

Visibility is carried by the `categories` references in Sanity — a post tagged
**Private** is a journal entry, anything else is public. Untagged posts stay
public, so entries written before this existed are unaffected.

Private entries are excluded inside the GROQ query, not filtered in the
browser. They never enter any page's HTML, never appear in
`generateStaticParams`, and their URLs return 404. The only way they leave the
server is through `/api/journal`, which requires the password.

## Writing

`/write` is the composing room. It asks for `ADMIN_PASSWORD`, then offers:

- **Compose new** — write an entry, choose Public or Private, preview a galley
  proof, publish.
- **Revise existing** — load any entry back into the form, edit it, save.
  Visibility can be flipped in either direction.

Drafts of new entries are kept in `localStorage` so a refresh cannot lose work.

The manuscript field takes a small subset of Markdown, converted to Portable
Text on save (`lib/to-portable-text.js`) and converted back when an entry is
reopened for editing:

```
## Heading            through ####
> Quotation
- Item   /   1. Item
**bold**  *italic*  `code`  [text](https://url)
```

## Sessions

Unlocking stores a signed token (`expiry.HMAC-SHA256`, keyed on
`ADMIN_PASSWORD`) rather than the password itself, valid 30 days. Changing
`ADMIN_PASSWORD` invalidates every token already issued.

## Layout

```
app/
  page.js              front page — lead article and story cards
  archive/             every entry, grouped by year
  post/[slug]/         article
  write/               composer
  api/
    unlock/            password -> token
    publish/           create or revise a post
    posts/             list/load entries for the composer
    journal/           private entries (authorised only)
components/            masthead, colophon, composer, journal, portable text
lib/                   sanity client + queries, auth, dates, markup
```
