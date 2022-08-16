import Link from 'next/link'
import React from 'react'
import styles from '../styles/Home.module.css'


const Blog = (props) => {
    const {title, description, slug} = props
  return (
    <Link href={`/blog/${slug}`}>
        <a className={styles.card}>
          <h2>{title}</h2>
        </a>
    </Link>
  )
}

export default Blog