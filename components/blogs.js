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
          Latest Blogs
        </h2>

        <div className={styles.grid}>
          {latestPosts.map((blog) => {
            return (
              <Blog 
                key={blog.slug.current} 
                slug={blog.slug.current} 
                title={blog.title} 
                description={blog.body[0].children[0].text.length>55 ? `${blog.body[0].children[0].text.slice(0, 55)}...` : blog.body[0].children[0].text}
              />
            )
          })}
        </div>
    </>
  )
}

export default Blogs
