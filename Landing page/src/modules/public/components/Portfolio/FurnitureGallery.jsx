// src/components/Portfolio/FurnitureGallery.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollLock } from '../../../../hooks/useScrollLock';
import { FaPlay, FaImage, FaTimes, FaCouch, FaEye, FaHeart, FaExpand } from 'react-icons/fa';
import { furniturePhotos, furnitureVideos } from '../../data/portfolioData';
import styles from './PortfolioGallery.module.css';

const FurnitureGallery = () => {
  const [activeTab, setActiveTab] = useState('videos');
  const [selectedMedia, setSelectedMedia] = useState(null);

  useScrollLock(!!selectedMedia);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <div className={styles.gallery}>
      {/* Premium Header */}
      <motion.div 
        className={styles.header}
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.div 
          className={styles.headerIcon}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          <FaCouch />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Furniture Portfolio
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Elegant designs crafted for modern living spaces — where comfort meets luxury
        </motion.p>
      </motion.div>

      {/* Stats Section */}
      <motion.div 
        className={styles.stats}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className={styles.stat}>
          <span className={styles.statNumber}>{furniturePhotos.length + furnitureVideos.length}+</span>
          <span className={styles.statLabel}>Projects</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNumber}>100%</span>
          <span className={styles.statLabel}>Satisfaction</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNumber}>Premium</span>
          <span className={styles.statLabel}>Quality</span>
        </div>
      </motion.div>

      {/* Premium Tabs */}
      <motion.div 
        className={styles.tabs}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7 }}
      >
        <button
          className={`${styles.tab} ${activeTab === 'photos' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('photos')}
        >
          <FaImage /> <span>Photos ({furniturePhotos.length})</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'videos' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          <FaPlay /> <span>Videos ({furnitureVideos.length})</span>
        </button>
      </motion.div>

      {/* Gallery Grid */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={activeTab}
          className={styles.grid}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0, scale: 0.95 }}
        >
          {activeTab === 'photos' && furniturePhotos.map((photo, index) => (
            <motion.div
              key={photo.id}
              className={styles.item}
              variants={itemVariants}
              whileHover={{ 
                y: -10,
                transition: { duration: 0.3 }
              }}
              onClick={() => setSelectedMedia(photo)}
            >
              <img src={photo.src} alt={photo.title} loading="lazy" />
              <div className={styles.overlay}>
                <motion.div
                  initial={{ scale: 0 }}
                  whileHover={{ scale: 1 }}
                  className={styles.playIcon}
                >
                  <FaExpand />
                </motion.div>
                <span className={styles.videoTitle}>{photo.title}</span>
              </div>
            </motion.div>
          ))}

          {activeTab === 'videos' && furnitureVideos.map((video, index) => (
            <motion.div
              key={video.id}
              className={styles.item}
              variants={itemVariants}
              whileHover={{ 
                y: -10,
                transition: { duration: 0.3 }
              }}
              onClick={() => setSelectedMedia(video)}
            >
              <video src={video.src} muted preload="metadata" />
              <div className={styles.overlay}>
                <motion.div
                  className={styles.playIcon}
                  whileHover={{ scale: 1.2 }}
                >
                  <FaPlay />
                </motion.div>
                <span className={styles.videoTitle}>{video.title}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Premium Modal */}
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
            <motion.button 
              className={styles.closeBtn} 
              onClick={() => setSelectedMedia(null)}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <FaTimes />
            </motion.button>
            <motion.div 
              className={styles.modalContent} 
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              {activeTab === 'photos' ? (
                <motion.img 
                  src={selectedMedia.src} 
                  alt={selectedMedia.title}
                  layoutId={`image-${selectedMedia.id}`}
                />
              ) : (
                <video 
                  src={selectedMedia.src} 
                  controls 
                  autoPlay 
                  className={styles.modalVideo}
                />
              )}
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {selectedMedia.title}
              </motion.h3>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FurnitureGallery;
