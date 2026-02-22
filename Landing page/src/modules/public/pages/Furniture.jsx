// src/pages/Furniture.jsx
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import FurnitureGallery from '../components/Portfolio/FurnitureGallery';
import styles from './Portfolio.module.css';

const Furniture = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <motion.div 
      className={styles.portfolioPage}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <FurnitureGallery />
    </motion.div>
  );
};

export default Furniture;
