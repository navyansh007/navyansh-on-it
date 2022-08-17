import Link from 'next/link'
import React from 'react'
import styles from '../styles/Home.module.css'
import moment from 'moment'

const Blog = (props) => {
    const {title, slug, publishedAt} = props
    const publishedDurationFromNow = moment(publishedAt).fromNow()
  return (
    <Link href={`/blog/${slug}`}>
        <a className={styles.card}>
          <h2>{title}</h2>
          <p style={{fontSize: '75%'}}>Published {publishedDurationFromNow}</p>
        </a>
    </Link>
  )
}

export default Blog