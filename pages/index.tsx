import type { NextPage } from 'next'
import Head from 'next/head'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>core</title>
        <meta name="description" content="core" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          core
        </h1>

        <p className={styles.description}>
          by ba-ka
        </p>

      </main>
    </div>
  )
}

export default Home
