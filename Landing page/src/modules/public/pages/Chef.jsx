// src/pages/Chef.jsx
import { useEffect } from 'react';
import ChefGallery from '../components/Portfolio/ChefGallery';
import styles from './Portfolio.module.css';

const Chef = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className={styles.portfolioPage}>
      <ChefGallery />
    </div>
  );
};

export default Chef;
