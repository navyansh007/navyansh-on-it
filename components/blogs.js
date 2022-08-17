import React from 'react'
import Blog from './blog'
import styles from '../styles/Home.module.css'
import { useRouter } from 'next/router'

const Blogs = ({posts}) => {
    const router = useRouter()
    const latestPosts = router.pathname === '/' && posts.length>25 ? posts.slice(0, 26) : posts
  return (
    <>
        <h2 style={{fontSize: '200%', color: '#0070f3'}}>
          {posts.length===0 ? 'No blogs to show currently, but more blogs are on the way' : 'Latest Blogs'}
        </h2>

        <div className={styles.grid}>
          {latestPosts.map((blog) => {
            return (
              <Blog 
                key={blog.slug.current} 
                slug={blog.slug.current} 
                title={blog.title} 
                publishedAt={blog.publishedAt}
              />
            )
          })}
        </div>
    </>
  )
}

export default Blogs
