// src/components/Portfolio/TravelGallery.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollLock } from '../../../../hooks/useScrollLock';
import { FaPlay, FaTimes, FaPlane } from 'react-icons/fa';
import { travelVideos } from '../../data/portfolioData'; // ← Make sure this is travelVideos
import styles from './PortfolioGallery.module.css';

const TravelGallery = () => {
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [filterAgency, setFilterAgency] = useState('All');

  useScrollLock(!!selectedMedia);

  const agencies = ['All', 'Sama Tours', 'Yalla Travel'];
  
  const filteredVideos = filterAgency === 'All' 
    ? travelVideos
    : travelVideos.filter(v => v.agency === filterAgency);

  return (
    <div className={styles.gallery}>
      <motion.div 
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <FaPlane className={styles.headerIcon} />
<h1>Travel Agency </h1>
<p>Discover breathtaking destinations through captivating visual storytelling</p>
<p>We collaborated with this Lebanese travel agency to provide premium video editing services, bringing their travel experiences to life</p>

      </motion.div>

      <motion.div 
        className={styles.filterContainer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {agencies.map((agency) => (
          <button
            key={agency}
            className={`${styles.filterBtn} ${filterAgency === agency ? styles.activeFilter : ''}`}
            onClick={() => setFilterAgency(agency)}
          >
            {agency}
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
          <span className={styles.statLabel}>Travel Videos</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNumber}>{agencies.length - 1}</span>
          <span className={styles.statLabel}>Travel Agencies</span>
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
              <span className={styles.overlayBrand}>{video.title}</span>
              <span className={styles.videoTitle}>{video.agency}</span>
            </div>
            <div className={styles.brandTag}>{video.agency}</div>
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
              <p className={styles.brandLabel}>{selectedMedia.agency}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TravelGallery;
