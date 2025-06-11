import { NextPage } from 'next';
import Head from 'next/head';
import dynamic from 'next/dynamic';

// Dynamically import Earth3D to avoid SSR issues with Three.js
const Earth3D = dynamic(() => import('../components/SustainableCities'), {
  ssr: false,
  loading: () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(to bottom, #000814 0%, #001d3d 50%, #003566 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif'
    }}>
      Gerçekçi Dünya yükleniyor...
    </div>
  ),
});

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Gerçekçi 3D Dünya | Climate Action</title>
        <meta name="description" content="Gerçek dünya haritaları ve gündüz/gece döngüsü ile gelişmiş 3D dünya simülasyonu" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main style={{ 
        margin: 0, 
        padding: 0, 
        overflow: 'hidden',
        fontFamily: 'Arial, sans-serif'
      }}>
        <Earth3D />
      </main>
    </>
  );
};

export default Home; 