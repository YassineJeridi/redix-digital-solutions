// src/components/WhyChooseUs/WhyChooseUs.jsx
import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import styles from './WhyChooseUs.module.css';
import {
  FaRocket,
  FaLightbulb,
  FaBullseye,
  FaUsers,
  FaGem,
  FaChartLine
} from 'react-icons/fa';

const WhyChooseUs = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });
  const { t } = useTranslation();

  // Alternative version with FontAwesome icons


  const features = [
    {
      icon: FaRocket,
      title: t('whyChooseUs.fastDelivery'),
      description: t('whyChooseUs.fastDeliveryDesc'),
      gradient: 'linear-gradient(135deg, #ff6b6b, #ee5a24)'
    },
    {
      icon: FaLightbulb,
      title: t('whyChooseUs.creativeSolutions'),
      description: t('whyChooseUs.creativeSolutionsDesc'),
      gradient: 'linear-gradient(135deg, #4834d4, #686de0)'
    },
    {
      icon: FaBullseye,
      title: t('whyChooseUs.resultsDriven'),
      description: t('whyChooseUs.resultsDrivenDesc'),
      gradient: 'linear-gradient(135deg, #00d2d3, #54a0ff)'
    },
    {
      icon: FaUsers,
      title: t('whyChooseUs.dedicatedSupport'),
      description: t('whyChooseUs.dedicatedSupportDesc'),
      gradient: 'linear-gradient(135deg, #5f27cd, #a55eea)'
    },
    {
      icon: FaGem,
      title: t('whyChooseUs.premiumQuality'),
      description: t('whyChooseUs.premiumQualityDesc'),
      gradient: 'linear-gradient(135deg, #ff9ff3, #f368e0)'
    },
    {
      icon: FaChartLine,
      title: t('whyChooseUs.provenTrack'),
      description: t('whyChooseUs.provenTrackDesc'),
      gradient: 'linear-gradient(135deg, #feca57, #ff9ff3)'
    }
  ];


  useEffect(() => {
    if (isInView) {
      setIsVisible(true);
    }
  }, [isInView]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const headerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  return (
    <section className={`${styles.whyChooseUs} ${isVisible ? styles.animate : ''}`} ref={sectionRef} id='why-choose-us'>
      {/* Animated Background Elements */}
      <motion.div
        className={styles.backgroundGlow}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className={styles.container}>
        {/* Header */}
        <motion.div
          className={styles.header}
          variants={headerVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
        >
          <motion.span
            className={styles.sectionTag}
            whileHover={{ scale: 1.05 }}
          >
            {t('whyChooseUs.tag')}
          </motion.span>

          <motion.h2 className={styles.title}>
            {t('whyChooseUs.title')}
            <span className={styles.highlight}>{t('whyChooseUs.highlight')}</span>
          </motion.h2>

          <motion.p className={styles.subtitle}>
            {t('whyChooseUs.subtitle')}
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className={styles.featuresGrid}
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
        >
          {features.map((feature, index) => {
            const IconComponent = feature.icon;

            return (
              <motion.article
                key={index}
                className={styles.featureCard}
                variants={itemVariants}
                whileHover={{
                  y: -15,
                  scale: 1.02,
                  transition: { duration: 0.3 }
                }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Card Glow Effect */}
                <motion.div
                  className={styles.cardGlow}
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />

                {/* Icon Wrapper */}
                <motion.div
                  className={styles.iconWrapper}
                  style={{ background: feature.gradient }}
                  whileHover={{
                    scale: 1.1,
                    rotate: 5,
                    transition: { duration: 0.2 }
                  }}
                >
                  <IconComponent className={styles.icon} />
                  <motion.div
                    className={styles.iconRipple}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.6, 0, 0.6]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>

                {/* Content */}
                <motion.div
                  className={styles.cardContent}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isVisible ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.1 + 0.3 }}
                >
                  <h3 className={styles.featureTitle}>{feature.title}</h3>
                  <p className={styles.featureDescription}>{feature.description}</p>
                </motion.div>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
