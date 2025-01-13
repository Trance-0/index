import Head from 'next/head';
import styles from '../styles/Home.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Academic Navigation</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className={styles.title}>
          Index
        </h1>

        <p className={styles.description}>
          Welcome to your academic dashboard. Use the widgets below to enhance your productivity.
        </p>

        <div className={styles.grid}>
          <div className={styles.card}>
            <h3>Timer &rarr;</h3>
            <p>Keep track of your study sessions with a customizable timer.</p>
            {/* Timer widget component can be inserted here */}
          </div>

          <div className={styles.card}>
            <h3>Random String Generator &rarr;</h3>
            <p>Generate random strings for your projects or passwords.</p>
            {/* Random String Generator widget component can be inserted here */}
          </div>

          <div className={styles.card}>
            <h3>Password Manager &rarr;</h3>
            <p>Securely store and manage your passwords.</p>
            {/* Password Manager widget component can be inserted here */}
          </div>

          <div className={styles.card}>
            <h3>Bookmarks &rarr;</h3>
            <p>Save and organize your important academic links.</p>
            {/* Bookmarks widget component can be inserted here */}
          </div>
        </div>
      </main>

      <footer>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <img src="/vercel.svg" alt="Vercel" className={styles.logo} />
        </a>
      </footer>

      <style jsx>{`
        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        footer {
          width: 100%;
          height: 100px;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        footer img {
          margin-left: 0.5rem;
        }
        footer a {
          display: flex;
          justify-content: center;
          align-items: center;
          text-decoration: none;
          color: inherit;
        }
        code {
          background: #fafafa;
          border-radius: 5px;
          padding: 0.75rem;
          font-size: 1.1rem;
          font-family:
            Menlo,
            Monaco,
            Lucida Console,
            Liberation Mono,
            DejaVu Sans Mono,
            Bitstream Vera Sans Mono,
            Courier New,
            monospace;
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family:
            -apple-system,
            BlinkMacSystemFont,
            Segoe UI,
            Roboto,
            Oxygen,
            Ubuntu,
            Cantarell,
            Fira Sans,
            Droid Sans,
            Helvetica Neue,
            sans-serif;
        }
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}
