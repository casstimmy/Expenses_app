import Head from 'next/head';
import '@/styles/globals.css'
import { ToastProvider } from '@/context/ToastContext';

export default function App({ Component, pageProps }) {
  return (
    <ToastProvider>
     <Head>
        <title>BizSuits™</title>
        <meta name="description" content="Best products at the best prices!" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
     <Component {...pageProps} />
    </ToastProvider>
  )
}
