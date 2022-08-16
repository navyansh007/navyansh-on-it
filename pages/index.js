import { createClient } from 'next-sanity'
import Head from 'next/head'
import Image from 'next/image'
import Blog from '../components/blog'
import Link from 'next/link'
import styles from '../styles/Home.module.css'
import Blogs from '../components/blogs'

export default function Home({posts}) {
  return (
    <div className={styles.container}>
      <Head>
        <title>Navyansh On It</title>
        <meta name="description" content="Navyansh Kesarwani's Personal Blogging Webs" />
        <meta name='keywords' content='navyanshkesarwani, navyansh, navyansh on it, navyansh kesarwani blogs, navyans blog, navyansh on it blog'/>
        <link rel="icon" href="/favicon.ico" />
        
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"/>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"/>
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"/>
        <link rel="manifest" href="/site.webmanifest"/>
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5"/>
        <meta name="msapplication-TileColor" content="#da532c"/>
        <meta name="theme-color" content="#ffffff"></meta>
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Navyansh On It
        </h1>

        <p className={styles.description}>
          Blogs for <strong>Coders</strong>, by a <strong>Coder</strong>
        </p>

        <Blogs posts={posts}/>
      </main>

      <footer className={styles.footer} style={{paddingTop: '0%', paddingBottom: '0%'}}>
          <p style={{color: '#0070f3'}}>Owned by <strong>Navyansh Kesarwani</strong></p>
      </footer>
    </div>
  )
}

export async function getServerSideProps(context){
  const client = createClient({
    projectId: 'krfx4zuu',
    dataset: 'production',
    useCdn: true
  })
  const query = `*[_type == 'post' ] | order(_createdAt desc)`
  const posts = await client.fetch(query)
  return {
    props: {
      posts
    }
  }
}
