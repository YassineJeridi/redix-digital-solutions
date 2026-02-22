// src/components/Services/ServiceCard.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { FaArrowRight, FaStar, FaCheck, FaGem } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import styles from './ServiceCard.module.css';

const ServiceCard = ({ service, onGetQuote }) => {
  const handleGetQuote = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onGetQuote(service);
  };

  const { t } = useTranslation();
  const IconComponent = service.icon;

  return (
    <motion.div
      className={`${styles.card} ${service.MostPopular ? styles.popular : ''} ${service.common ? styles.common : ''}`}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Most Popular Badge */}
      {service.MostPopular && (
        <div className={styles.popularBadge}>
          <FaStar /> {t('services.mostPopular')}
        </div>
      )}

      {/* Common Badge */}
      {service.common && !service.MostPopular && (
        <div className={styles.commonBadge}>
          <FaGem /> {t('services.common')}
        </div>
      )}

      {/* Icon with glow wrapper */}
      <div className={styles.iconWrapper}>
        <div className={styles.iconGlow} />
        <div className={styles.iconContainer}>
          <IconComponent />
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <h3 className={styles.title}>{service.title}</h3>
        <p className={styles.description}>{service.description}</p>

        {/* Pricing */}
        <div className={styles.pricing}>
          <span className={styles.price}>{service.pricing}</span>
        </div>

        {/* Features */}
        <ul className={styles.features}>
          {service.features?.slice(0, 4).map((feature, index) => (
            <li key={index}>
              <FaCheck />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Button */}
      <button className={styles.btn} onClick={handleGetQuote}>
        {t('services.getQuote')} <FaArrowRight />
      </button>
    </motion.div>
  );
};

export default ServiceCard;
