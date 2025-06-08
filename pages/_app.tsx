import type { AppProps } from 'next/app';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div style={{ 
      margin: 0, 
      padding: 0, 
      height: '100vh', 
      overflow: 'hidden',
      fontFamily: 'Arial, sans-serif'
    }}>
      <Component {...pageProps} />
    </div>
  );
} 