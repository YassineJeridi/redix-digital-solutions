// src/components/Portfolio/FashionGallery.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollLock } from '../../../../hooks/useScrollLock';
import { FaPlay, FaTimes, FaTshirt } from 'react-icons/fa';
import { fashionVideos } from '../../data/portfolioData'; // ← Make sure this is fashionVideos
import styles from './PortfolioGallery.module.css';

const FashionGallery = () => {
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState('All');

  useScrollLock(!!selectedMedia);

  const brands = ['All', 'Nude Style', 'BTheLabel', 'Roar', 'Stripes'];

  const filteredVideos = selectedBrand === 'All' 
    ? fashionVideos
    : fashionVideos.filter(v => v.brand === selectedBrand);

  return (
    <div className={styles.gallery}>
      <motion.div 
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <FaTshirt className={styles.headerIcon} />
        <h1>Fashion Portfolio</h1>
        <p>Trendsetting designs and contemporary fashion statements</p>
        
      </motion.div>

      <motion.div 
        className={styles.filterContainer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {brands.map((brand) => (
          <button
            key={brand}
            className={`${styles.filterBtn} ${selectedBrand === brand ? styles.activeFilter : ''}`}
            onClick={() => setSelectedBrand(brand)}
          >
            {brand}
          </button>
        ))}
      </motion.div>

      <motion.div 
        className={styles.stats}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div className={styles.stat}>
          <span className={styles.statNumber}>{filteredVideos.length}</span>
          <span className={styles.statLabel}>Fashion Videos</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNumber}>{brands.length - 1}</span>
          <span className={styles.statLabel}>Fashion Brands</span>
        </div>
      </motion.div>

      <div className={styles.grid}>
        {filteredVideos.map((video, index) => (
          <motion.div
            key={video.id}
            className={styles.item}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedMedia(video)}
          >
            <video src={video.src} muted preload="metadata" />
            <div className={styles.overlay}>
              <FaPlay className={styles.playIcon} />
              <span className={styles.overlayBrand}>{video.brand}</span>
              <span className={styles.videoTitle}>{video.title}</span>
            </div>
            <div className={styles.brandTag}>{video.brand}</div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            className={styles.modal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setSelectedMedia(null)}
          >
            <button 
              className={styles.closeBtn} 
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMedia(null);
              }}
            >
              <FaTimes />
            </button>
            <motion.div 
              className={styles.modalContent} 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <video 
                src={selectedMedia.src} 
                controls 
                autoPlay 
                className={styles.modalVideo}
              />
              <h3>{selectedMedia.title}</h3>
              <p className={styles.brandLabel}>{selectedMedia.brand}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FashionGallery;
