// src/components/DevProject/ProjectModal/ProjectModal.jsx
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollLock } from '../../../../../hooks/useScrollLock';
import { 
  FaTimes, FaExternalLinkAlt, FaGithub, FaStar, FaPlay, 
  FaImages, FaChevronLeft, FaChevronRight, FaExpand 
} from 'react-icons/fa';
import styles from './ProjectModal.module.css';

const ProjectModal = ({ project, isOpen, onClose }) => {
  useScrollLock(isOpen);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const handlePrevImage = useCallback(() => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? project.images.screenshots.length - 1 : prev - 1
    );
  }, [project?.images.screenshots.length]);

  const handleNextImage = useCallback(() => {
    setCurrentImageIndex((prev) => 
      prev === project.images.screenshots.length - 1 ? 0 : prev + 1
    );
  }, [project?.images.screenshots.length]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  if (!project) return null;

  const allImages = [project.images.main, ...project.images.screenshots];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.modalBackdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
        >
          <motion.div
            className={styles.modalContainer}
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {/* Header */}
            <div className={styles.modalHeader}>
              <div className={styles.headerContent}>
                <div className={styles.titleSection}>
                  <h2>{project.title}</h2>
                  <span className={styles.subtitle}>{project.subtitle}</span>
                  {project.featured && (
                    <div className={styles.featuredBadge}>
                      <FaStar />
                      Featured
                    </div>
                  )}
                </div>
                
                <button className={styles.closeButton} onClick={onClose}>
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Image Gallery Section */}
            <div className={styles.gallerySection}>
              <div className={styles.mainImageContainer}>
                <motion.img
                  key={currentImageIndex}
                  src={allImages[currentImageIndex]}
                  alt={`${project.title} - Image ${currentImageIndex + 1}`}
                  className={styles.mainImage}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                />
                
                <button 
                  className={styles.fullscreenBtn}
                  onClick={toggleFullscreen}
                >
                  <FaExpand />
                </button>

                {allImages.length > 1 && (
                  <>
                    <button 
                      className={`${styles.navBtn} ${styles.prevBtn}`}
                      onClick={handlePrevImage}
                    >
                      <FaChevronLeft />
                    </button>
                    
                    <button 
                      className={`${styles.navBtn} ${styles.nextBtn}`}
                      onClick={handleNextImage}
                    >
                      <FaChevronRight />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail Navigation */}
              <div className={styles.thumbnailNav}>
                {allImages.map((image, index) => (
                  <button
                    key={index}
                    className={`${styles.thumbnail} ${
                      index === currentImageIndex ? styles.active : ''
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img src={image} alt={`Thumbnail ${index + 1}`} />
                    {index === 0 && <span className={styles.mainLabel}>Main</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Section */}
            <div className={styles.contentSection}>
              {/* Project Info Grid */}
              <div className={styles.infoGrid}>
                <div className={styles.infoCard}>
                  <h4>Project Details</h4>
                  <div className={styles.detailsList}>
                    <div className={styles.detail}>
                      <span>Industry:</span>
                      <span>{project.industry}</span>
                    </div>
                    <div className={styles.detail}>
                      <span>Year:</span>
                      <span>{project.year}</span>
                    </div>
                    <div className={styles.detail}>
                      <span>Client:</span>
                      <span>{project.client}</span>
                    </div>
                    <div className={styles.detail}>
                      <span>Category:</span>
                      <span>{project.category}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.infoCard}>
                  <h4>Performance</h4>
                  <div className={styles.metricsGrid}>
                    <div className={styles.metricItem}>
                      <span className={styles.metricValue}>{project.metrics.loadTime}</span>
                      <span className={styles.metricLabel}>Load Time</span>
                    </div>
                    <div className={styles.metricItem}>
                      <span className={styles.metricValue}>{project.metrics.lighthouse}</span>
                      <span className={styles.metricLabel}>Lighthouse</span>
                    </div>
                    <div className={styles.metricItem}>
                      <span className={styles.metricValue}>{project.metrics.responsive}</span>
                      <span className={styles.metricLabel}>Mobile</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className={styles.description}>
                <h4>About This Project</h4>
                <p>{project.description}</p>
              </div>

              {/* Technologies */}
              <div className={styles.techSection}>
                <h4>Technologies Used</h4>
                <div className={styles.techGrid}>
                  {project.technologies.map((tech, index) => (
                    <span key={index} className={styles.techBadge}>
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className={styles.featuresSection}>
                <h4>Key Features</h4>
                <div className={styles.featuresList}>
                  {project.features.map((feature, index) => (
                    <div key={index} className={styles.featureItem}>
                      <div className={styles.featureIcon}>✓</div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className={styles.actionSection}>
                {project.status === 'Live' && project.url && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.primaryBtn}
                  >
                    <FaPlay />
                    View Live Site
                  </a>
                )}
                
                {project.status === 'Screenshots' && (
                  <div className={styles.screenshotsBtn}>
                    <FaImages />
                    Screenshots Only
                  </div>
                )}
                
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.secondaryBtn}
                  >
                    <FaGithub />
                    View Source
                  </a>
                )}
              </div>
            </div>

            {/* Fullscreen Modal */}
            <AnimatePresence>
              {isFullscreen && (
                <motion.div
                  className={styles.fullscreenModal}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={toggleFullscreen}
                >
                  <img
                    src={allImages[currentImageIndex]}
                    alt={`${project.title} - Fullscreen`}
                    className={styles.fullscreenImage}
                  />
                  <button className={styles.fullscreenClose}>
                    <FaTimes />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProjectModal;
