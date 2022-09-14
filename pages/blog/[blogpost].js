import React from 'react'
import { createClient } from 'next-sanity'
import styles from '../../styles/Home.module.css'
import Head from 'next/head'
import imageUrlBuilder from '@sanity/image-url'
import moment from 'moment'
import Script from 'next/script'


const Blogpost = ({posts}) => {

    const client = createClient({
        projectId: 'krfx4zuu',
        dataset: 'production',
        useCdn: true
    })
    const builder = imageUrlBuilder(client)
    function urlFor(source) {
        return builder.image(source)
    }

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
                            if(posts[0].body[index]._type==='image'){
                                return(
                                    <img key={index} style={
                                        {
                                            display: 'block', 
                                            marginLeft: 'auto',
                                            marginRight: 'auto',
                                        }} 
                                        src={`${urlFor(posts[0].body[index].asset).auto('format').url()}`}
                                    />
                                )
                            } else {
                                return(
                                    <p key={index} className={styles.blog_paragraphs}>
                                        {posts[0].body[index].children[0].text}
                                    </p>
                                )
                            }
                        })
                    }
                    <div className={styles.publish_record}>
                        <p className={styles.timestamp}>Published at <strong>{moment(posts[0].publishedAt).utc().add({h: 5, m:30}).format('DD-MM-YYYY HH:mm:ss')} IST</strong></p>
                        <p className={styles.timestamp}>Updated at <strong>{moment(posts[0]._updatedAt).utc().add({h: 5, m:30}).format('DD-MM-YYYY HH:mm:ss')} IST</strong></p>
                    </div>
                </div>
            </main>
            <div>
                <ins 
                    className="adsbygoogle"
                    style={{ display: "block" }}
                    data-ad-client="ca-pub-9573866664396327"
                    data-ad-slot="9215262735"
                    data-ad-format="auto"
                    data-full-width-responsive="true">
                </ins>
                <Script onLoad={
                    () => (adsbygoogle = window.adsbygoogle || []).push({})
                    }
                />
            </div>
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