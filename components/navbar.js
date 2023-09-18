import React from 'react'
import styles from '../styles/Home.module.css'
import Link from 'next/link'

const Navbar = () => {
  const [searchedPost, setSearchedPost] = React.useState('')
  return (
    <nav className={styles.navbar}>
        <ul>
            <li><Link href={'/'}>Home</Link></li>
            <li><Link href={'/blogs'}>Blogs</Link></li>
        </ul>
    </nav>
  )
}

export default Navbar