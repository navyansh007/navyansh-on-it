import React from 'react'
import Blogs from '../components/blogs' 
import { createClient } from 'next-sanity'
import styles from '../styles/Home.module.css'
import Head from 'next/head'

const Blogposts = ({posts}) => {
  return (
    <>
      <Head>
        <title>Blogs</title>
      </Head>
      <div className={styles.container}>
        <main className={styles.main}>
          <Blogs posts={posts}/>
        </main>
      </div>
    </>
  )
}

export default Blogposts

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
