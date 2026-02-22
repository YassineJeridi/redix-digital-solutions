// src/components/TrustedBy/TrustedBy.jsx
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { clients } from '../../data/clients';
import styles from './TrustedBy.module.css';

const TrustedBy = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const { t } = useTranslation();

  // Duplicate logos for seamless infinite loop
  const logoSet = [...clients, ...clients];

  const stats = [
    { number: '100+', label: t('trustedBy.projectsCompleted') },
    { number: '50+', label: t('trustedBy.happyClients') },
    { number: '3+', label: t('trustedBy.yearsExperience') },
    { number: '24/7', label: t('trustedBy.supportAvailable') }
  ];

  return (
    <section className={styles.trustedBy} ref={ref} id="trusted">
      <div className={styles.container}>
        {/* Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className={styles.sectionTag}>{t('trustedBy.tag')}</span>
          <h2 className={styles.title}>{t('trustedBy.title')}</h2>
          <p className={styles.subtitle}>
            {t('trustedBy.subtitle')}
          </p>
        </motion.div>

        {/* Infinite Marquee */}
        <motion.div
          className={styles.marqueeSection}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className={styles.marqueeTrack}>
            <div className={styles.marqueeContent}>
              {logoSet.map((client, index) => (
                <div key={`${client.name}-${index}`} className={styles.logoItem}>
                  <img
                    src={client.logo}
                    alt={client.name}
                    className={styles.clientLogo}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className={styles.fadeLeft} />
          <div className={styles.fadeRight} />
        </motion.div>

        {/* Stats */}
        <motion.div
          className={styles.stats}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {stats.map((stat, index) => (
            <div key={index} className={styles.statItem}>
              <span className={styles.statNumber}>{stat.number}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TrustedBy;
