import React, { useEffect } from 'react'
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

    useEffect(() => {
        console.log(posts)
    }, [])

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
                                            width: '50%'
                                        }} 
                                        src={`${urlFor(posts[0].body[index].asset).auto('format').url()}`}
                                    />
                                )
                            }

                            else if(posts[0].body[index].listItem && posts[0].body[index].listItem==='bullet'){
                                return(
                                    <ul key={index} className={styles.blog_paragraphs}>
                                        {
                                            posts[0].body[index].children.map((listItem, index) => {
                                                return(
                                                    <li key={index} className={styles.blog_paragraphs}>
                                                        {listItem.text}
                                                    </li>
                                                )
                                            })
                                        }
                                    </ul>
                                )
                            }

                            // Render the style or tag which is associated with the children text
                            else if(posts[0].body[index].children[0].marks.length>0){
                                if(posts[0].body[index].children[0].marks[0]==='strong'){
                                    return(
                                        <p key={index} className={styles.blog_paragraphs}>
                                            <strong>{posts[0].body[index].children[0].text}</strong>
                                        </p>
                                    )
                                } else if (posts[0].body[index].children[0].marks[0]==='em'){
                                    return(
                                        <p key={index} className={styles.blog_paragraphs}>
                                            <em>{posts[0].body[index].children[0].text}</em>
                                        </p>
                                    )
                                }
                            }

                            // Render the headings which are associated with the children text
                            else if(posts[0].body[index].style){
                                if (posts[0].body[index].style === 'h1'){
                                    return (
                                        <h1 key={index} className={styles.content_h1}>
                                            {posts[0].body[index].children[0].text}
                                        </h1>
                                    )
                                }
                                else if(posts[0].body[index].style === 'h2'){
                                    return (
                                        <h2 key={index} className={styles.content_h2}>
                                            {posts[0].body[index].children[0].text}
                                        </h2>
                                    )
                                }
                                else if(posts[0].body[index].style === 'h3'){
                                    return (
                                        <h3 key={index} className={styles.content_h3}>
                                            {posts[0].body[index].children[0].text}
                                        </h3>
                                    )
                                }
                                else if(posts[0].body[index].style === 'h4'){
                                    return (
                                        <h4 key={index} className={styles.content_h4}>
                                            {posts[0].body[index].children[0].text}
                                        </h4>
                                    )
                                } else {
                                    return(
                                        <p key={index} className={styles.blog_paragraphs}>
                                            {posts[0].body[index].children[0].text}
                                        </p>
                                    )
                                }
                            }
                            else {
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
