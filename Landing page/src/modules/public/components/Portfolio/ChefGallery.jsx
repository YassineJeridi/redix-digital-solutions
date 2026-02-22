// src/components/Portfolio/ChefGallery.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useScrollLock } from '../../../../hooks/useScrollLock';
import { FaPlay, FaTimes, FaUtensils } from 'react-icons/fa';
import { chefVideos } from '../../data/portfolioData';
import styles from './PortfolioGallery.module.css';

const ChefGallery = () => {
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useScrollLock(!!selectedMedia);

  const categories = ['All', 'Main Course', 'Appetizer', 'Dessert'];

  const filteredVideos = selectedCategory === 'All' 
    ? chefVideos 
    : chefVideos.filter(v => v.category === selectedCategory);

  return (
    <div className={styles.gallery}>
      {/* Header */}
      <motion.div 
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <FaUtensils className={styles.headerIcon} />
        <h1>Chef / restaurant</h1>
        <p>Culinary excellence and artistic food presentations</p>
      </motion.div>

      {/* Category Filter */}
      <motion.div 
        className={styles.filterContainer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {categories.map((category) => (
          <button
            key={category}
            className={`${styles.filterBtn} ${selectedCategory === category ? styles.activeFilter : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </motion.div>

      {/* Stats */}
      <motion.div 
        className={styles.stats}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className={styles.stat}>
          <span className={styles.statNumber}>{filteredVideos.length}</span>
          <span className={styles.statLabel}>Culinary Creations</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNumber}>{categories.length - 1}</span>
          <span className={styles.statLabel}>Dish Categories</span>
        </div>
      </motion.div>

      {/* Video Grid */}
      <div className={styles.grid}>
        {filteredVideos.map((video, index) => (
          <motion.div
            key={video.id}
            className={styles.item}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => setSelectedMedia(video)}
          >
            <video src={video.src} muted preload="metadata" />
            <div className={styles.overlay}>
              <FaPlay className={styles.playIcon} />
              <span>{video.title}</span>
              <span className={styles.categoryTag}>{video.category}</span>
            </div>
            <div className={styles.brandTag}>{video.category}</div>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      {selectedMedia && (
        <motion.div
          className={styles.modal}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedMedia(null)}
        >
          <button className={styles.closeBtn} onClick={() => setSelectedMedia(null)}>
            <FaTimes />
          </button>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <video src={selectedMedia.src} controls autoPlay className={styles.modalVideo} />
            <h3>{selectedMedia.title}</h3>
            <p className={styles.categoryLabel}>{selectedMedia.category}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ChefGallery;
