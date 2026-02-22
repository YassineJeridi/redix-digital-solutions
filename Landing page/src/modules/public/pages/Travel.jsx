// src/pages/Travel.jsx
import { useEffect } from 'react';
import TravelGallery from '../components/Portfolio/TravelGallery';
import styles from './Portfolio.module.css';

const Travel = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className={styles.portfolioPage}>
      <TravelGallery />
    </div>
  );
};

export default Travel;
