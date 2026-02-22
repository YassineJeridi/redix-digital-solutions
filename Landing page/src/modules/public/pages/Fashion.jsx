// src/pages/Fashion.jsx
import { useEffect } from 'react';
import FashionGallery from '../components/Portfolio/FashionGallery';
import styles from './Portfolio.module.css';

const Fashion = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className={styles.portfolioPage}>
      <FashionGallery />
    </div>
  );
};

export default Fashion;
