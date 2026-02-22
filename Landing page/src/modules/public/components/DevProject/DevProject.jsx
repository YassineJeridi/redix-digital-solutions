// src/components/DevProject/DevProject.jsx
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCode, FaStar, FaExternalLinkAlt, FaEye,
  FaGithub, FaPlay, FaImages
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { websites } from '../../data/websites';
import ProjectModal from './ProjectModal/ProjectModal';
import styles from './DevProject.module.css';

const DevProject = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useTranslation();

  const handleProjectView = useCallback((project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedProject(null);
  }, []);

  return (
    <section className={styles.portfolioSection}>
      {/* Background */}
      <div className={styles.bgEffects}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.gridOverlay} />
      </div>

      <div className={styles.container}>
        {/* Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className={styles.badge}>
            <FaCode />
            {t('devProject.badge')}
          </span>
          <h2 className={styles.title}>{t('devProject.title')}</h2>
          <p className={styles.subtitle}>{t('devProject.subtitle')}</p>
        </motion.div>

        {/* Case-study showcase */}
        <div className={styles.showcase}>
          {websites.map((project, idx) => {
            const isEven = idx % 2 === 0;
            return (
              <motion.article
                key={project.id}
                className={`${styles.caseStudy} ${isEven ? styles.csLeft : styles.csRight}`}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.65, delay: 0.1 }}
              >
                {/* Browser mockup */}
                <div className={styles.browserWrap} onClick={() => handleProjectView(project)}>
                  <div className={styles.browserChrome}>
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                    <span className={styles.urlBar}>
                      {project.url
                        ? project.url.replace(/^https?:\/\//, '').replace(/\/$/, '')
                        : project.title.toLowerCase().replace(/\s+/g, '') + '.com'}
                    </span>
                  </div>
                  <div className={styles.browserBody}>
                    <img
                      src={project.images.main}
                      alt={project.title}
                      loading="lazy"
                      className={styles.browserImg}
                    />
                    {/* Hover overlay */}
                    <div className={styles.browserOverlay}>
                      <span className={styles.overlayBtn}>
                        <FaEye /> {t('devProject.viewProject')}
                      </span>
                    </div>
                  </div>

                  {/* Floating screenshots */}
                  {project.images.screenshots.length > 0 && (
                    <div className={styles.floatingScreens}>
                      {project.images.screenshots.slice(0, 2).map((src, i) => (
                        <motion.div
                          key={i}
                          className={styles.floatThumb}
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
                        >
                          <img src={src} alt="" loading="lazy" />
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Featured ribbon */}
                  {project.featured && (
                    <div className={styles.featuredRibbon}>
                      <FaStar /> {t('devProject.featured')}
                    </div>
                  )}
                </div>

                {/* Info panel */}
                <div className={styles.infoPanel}>
                  <div className={styles.infoBadges}>
                    <span className={styles.categoryBadge}>{project.category}</span>
                    <span className={styles.yearBadge}>{project.year}</span>
                    {project.status === 'Live' ? (
                      <span className={styles.liveBadge}><FaPlay /> Live</span>
                    ) : (
                      <span className={styles.screenshotsBadge}><FaImages /> Demo</span>
                    )}
                  </div>

                  <h3 className={styles.projectTitle}>{project.title}</h3>
                  <p className={styles.projectSub}>{project.subtitle}</p>
                  <p className={styles.projectDesc}>{project.description}</p>

                  {/* Tech pills */}
                  <div className={styles.techRow}>
                    {project.technologies.map((tech, i) => (
                      <span key={i} className={styles.techPill}>{tech}</span>
                    ))}
                  </div>

                  {/* Metrics */}
                  <div className={styles.metrics}>
                    <div className={styles.metricItem}>
                      <span className={styles.metricVal}>{project.metrics.loadTime}</span>
                      <span className={styles.metricLbl}>{t('devProject.speed')}</span>
                    </div>
                    <div className={styles.metricDivider} />
                    <div className={styles.metricItem}>
                      <span className={styles.metricVal}>{project.metrics.lighthouse}</span>
                      <span className={styles.metricLbl}>{t('devProject.score')}</span>
                    </div>
                    <div className={styles.metricDivider} />
                    <div className={styles.metricItem}>
                      <span className={styles.metricVal}>{project.metrics.responsive}</span>
                      <span className={styles.metricLbl}>Responsive</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className={styles.actions}>
                    <button
                      className={styles.viewBtn}
                      onClick={() => handleProjectView(project)}
                    >
                      <FaEye /> {t('devProject.viewProject')}
                    </button>
                    {project.url && project.status === 'Live' && (
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.visitBtn}
                      >
                        <FaExternalLinkAlt /> Visit Site
                      </a>
                    )}
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.githubBtn}
                      >
                        <FaGithub />
                      </a>
                    )}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>

      <ProjectModal
        project={selectedProject}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </section>
  );
};

export default DevProject;
