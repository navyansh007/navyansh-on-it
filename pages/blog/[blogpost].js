import React from 'react'
import { createClient } from 'next-sanity'
import styles from '../../styles/Home.module.css'
import Head from 'next/head'

const Blogpost = ({posts}) => {
    return(
        <div className="container">
            <Head>
                <title>{posts[0].title}</title>
            </Head>
            <main className={styles.main}>
                <h1 className={styles.title}>
                    {posts[0].title}
                </h1>
                <div style={{marginTop: '5%', maxWidth: '80%'}}>
                {
                    posts[0].body.map((paragraph, index) => {
                        return(
                            <p key={index} className={styles.blog_paragraphs}>
                                {posts[0].body[index].children[0].text}
                            </p>
                        )
                    })
                }
                </div>
            </main>
        </div>
    )
}

export async function getServerSideProps(context){
    const client = createClient({
      projectId: 'krfx4zuu',
      dataset: 'production',
      useCdn: true
    })
    const blogpost = context.query.blogpost
    const query = `*[slug.current == '${blogpost}' ]`
    const posts = await client.fetch(query)
    return {
      props: {
        posts
      }
    }
}


export default Blogpost