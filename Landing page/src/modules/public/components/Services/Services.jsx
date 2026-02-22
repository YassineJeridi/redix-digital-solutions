// src/components/Services/Services.jsx — Infinite Carousel
import { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  FaCode, FaMobile, FaChartLine, FaPencilRuler, FaVideo, FaCloud, FaPalette,
  FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { services } from '../../data/services';
import ServiceCard from './ServiceCard';
import BookingModal from '../BookingModal/BookingModal';
import styles from './Services.module.css';

const Services = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 });
  const [selectedService, setSelectedService] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 left, 1 right
  const [visibleCount, setVisibleCount] = useState(3);
  const { t } = useTranslation();

  // Icon mappings
  const iconMap = useMemo(() => ({
    1: FaCode, 2: FaChartLine, 3: FaMobile,
    4: FaPencilRuler, 5: FaVideo, 6: FaCloud, 7: FaPalette
  }), []);

  const enhancedServices = useMemo(() =>
    services.map(s => ({
      ...s,
      icon: iconMap[s.id] || FaCode,
      isPopular: s.MostPopular || false,
      isCommon: s.common || false
    })), [iconMap]);

  const total = enhancedServices.length;

  // Responsive visible count
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setVisibleCount(w <= 768 ? 1 : w <= 1100 ? 2 : 3);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Carousel navigation
  const go = useCallback((dir) => {
    setDirection(dir);
    setCurrentIndex(prev => (prev + dir + total) % total);
  }, [total]);

  // Keyboard nav
  useEffect(() => {
    const onKey = (e) => {
      if (showBooking) return;
      if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, showBooking]);

  // Build visible slice (circular)
  const visibleServices = useMemo(() => {
    const result = [];
    for (let i = 0; i < visibleCount; i++) {
      const idx = (currentIndex + i) % total;
      result.push({ ...enhancedServices[idx], _key: `${idx}-${currentIndex}` });
    }
    return result;
  }, [currentIndex, enhancedServices, total, visibleCount]);

  // Book now handler
  const handleBook = useCallback((service) => {
    setSelectedService(service);
    setShowBooking(true);
  }, []);

  // Slide variants
  const slideVariants = {
    enter: (d) => ({ x: d > 0 ? 280 : -280, opacity: 0, scale: 0.92 }),
    center: { x: 0, opacity: 1, scale: 1, pointerEvents: 'auto' },
    exit: (d) => ({ x: d > 0 ? -280 : 280, opacity: 0, scale: 0.92, pointerEvents: 'none' })
  };

  return (
    <section ref={sectionRef} id="services" className={styles.section}>
      <div className={styles.container}>
        {/* Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className={styles.title}>{t('services.title')}</h2>
          <p className={styles.subtitle}>
            {t('services.subtitle')}
          </p>
        </motion.div>

        {/* Carousel Viewport */}
        <div className={styles.carouselContainer}>
          {/* Left Arrow */}
          <button
            className={`${styles.navArrow} ${styles.navLeft}`}
            onClick={() => go(-1)}
            aria-label="Previous service"
          >
            <FaChevronLeft />
          </button>

          {/* Cards Track */}
          <div className={styles.track}>
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              {visibleServices.map((service, i) => (
                <motion.div
                  key={service._key + '-' + i}
                  className={styles.cardSlot}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                >
                  <ServiceCard service={service} onGetQuote={handleBook} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Right Arrow */}
          <button
            className={`${styles.navArrow} ${styles.navRight}`}
            onClick={() => go(1)}
            aria-label="Next service"
          >
            <FaChevronRight />
          </button>
        </div>

        {/* Indicators */}
        <div className={styles.indicators}>
          {enhancedServices.map((s, i) => (
            <button
              key={s.id}
              className={`${styles.dot} ${i === currentIndex ? styles.dotActive : ''}`}
              onClick={() => { setDirection(i > currentIndex ? 1 : -1); setCurrentIndex(i); }}
              aria-label={`Go to ${s.title}`}
            />
          ))}
        </div>


      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {showBooking && selectedService && (
          <BookingModal
            service={selectedService}
            onClose={() => { setShowBooking(false); setSelectedService(null); }}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

export default Services;
