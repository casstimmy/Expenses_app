import Head from 'next/head';
import '@/styles/globals.css'


export default function App({ Component, pageProps }) {
  return (
    <>
     <Head>
        <title>Ibile Expense</title>
        <meta name="description" content="Best products at the best prices!" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
      </>
  )
}
