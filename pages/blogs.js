import React from 'react'
import Blogs from '../components/blogs' 
import { createClient } from 'next-sanity'
import styles from '../styles/Home.module.css'
const Blogposts = ({posts}) => {
  return (
    <>
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
