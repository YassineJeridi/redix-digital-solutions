import { Link } from 'react-router-dom';
import styles from './NotFound.module.css';

const NotFound = () => {

  return (
    <div className={styles.notFoundPage}>
      {/* Background effects */}
      <div className={styles.scanlines} />
      <div className={styles.gridBg} />
      <div className={styles.orb + ' ' + styles.orb1} />
      <div className={styles.orb + ' ' + styles.orb2} />
      <div className={styles.orb + ' ' + styles.orb3} />

      {/* Floating particles */}
      <div className={styles.particles}>
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className={styles.particle}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${3 + Math.random() * 5}s`,
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className={styles.content}>
        <div className={styles.glitchWrapper}>
          <div className={styles.errorCode} data-text="404.">
            404.
          </div>
        </div>

        <h2 className={styles.subtitle}>Signal Lost</h2>
        <p className={styles.description}>
          The page you're looking for has drifted into the void. 
          It may have been moved, deleted, or never existed in this dimension.
        </p>

        <Link to="/" className={styles.homeBtn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Return Home
        </Link>
      </div>


    </div>
  );
};

export default NotFound;
