// src/components/Testimonials/Testimonials.jsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { FaArrowLeft, FaArrowRight, FaStar } from 'react-icons/fa';
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import styles from './Testimonials.module.css';
import { testimonials } from '../../data/testimonials';

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [[direction, isAnimating], setDirection] = useState([1, false]);
  const [isVisible, setIsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });
  const { t } = useTranslation();

  useEffect(() => {
    if (isInView) {
      setIsVisible(true);
    }
  }, [isInView]);

  // Auto-rotate testimonials
  useEffect(() => {
    if (!isPaused && isVisible) {
      const interval = setInterval(() => {
        setDirection([1, true]);
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [isPaused, isVisible]);

  const nextTestimonial = () => {
    setDirection([1, true]);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setDirection([-1, true]);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  // Direction-aware animation variants
  // dir = 1 (next): enter from right, exit to left
  // dir = -1 (prev): enter from left, exit to right
  const cardVariants = {
    enter: (dir) => ({
      x: dir * 200,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.35,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    exit: (dir) => ({
      x: dir * -200,
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.25,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    })
  };

  return (
    <section className={styles.testimonials} ref={sectionRef} id="testimonials">
      {/* Advanced Animated Background */}
      <div className={styles.backgroundAnimations}>
        {/* Floating Orbs */}
        <div className={styles.floatingOrbs}>
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className={`${styles.orb} ${styles[`orb${i + 1}`]}`}
              animate={{
                y: [-30, 30, -30],
                x: [-20, 20, -20],
                scale: [0.8, 1.3, 0.8],
                opacity: [0.2, 0.6, 0.2]
              }}
              transition={{
                duration: 6 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.8
              }}
            />
          ))}
        </div>

        {/* Animated Particles */}
        <div className={styles.particles}>
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className={styles.particle}
              animate={{
                y: [-100, -500],
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: Math.random() * 4,
                ease: "easeOut"
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: '100%'
              }}
            />
          ))}
        </div>

        {/* Rotating Elements */}
        <div className={styles.rotatingElements}>
          <motion.div
            className={styles.rotatingRing}
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className={styles.rotatingRing2}
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </div>

      <div className={styles.container}>
        {/* Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 50 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.span
            className={styles.sectionTag}
            whileHover={{ scale: 1.05 }}
          >
            {t('testimonials.tag')}
          </motion.span>
          <motion.h2 className={styles.title}>
            {t('testimonials.title')}
          </motion.h2>
          <motion.p className={styles.subtitle}>
            {t('testimonials.subtitle')}
          </motion.p>
        </motion.div>

        {/* Testimonial Carousel */}
        <motion.div
          className={styles.carouselContainer}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isVisible ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className={styles.carousel}>
            {/* Left Arrow - Using Feather Icons for cleaner look */}
            <motion.button
              className={`${styles.navArrow} ${styles.leftArrow}`}
              onClick={prevTestimonial}
              whileHover={{ scale: 1.1, x: -3 }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0, x: -20 }}
              animate={isVisible ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.8 }}
              aria-label="Previous testimonial"
            >
              <FiArrowLeft />
            </motion.button>

            {/* Testimonial Cards */}
            <div className={styles.cardContainer}>
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentIndex}
                  className={styles.testimonialCard}
                  custom={direction}
                  variants={cardVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  {/* Quote Icon */}
                  <motion.div
                    className={styles.quoteIcon}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    "
                  </motion.div>

                  {/* Testimonial Text */}
                  <motion.p
                    className={styles.testimonialText}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    {t(`testimonials.items.${testimonials[currentIndex].id}.text`)}
                  </motion.p>

                  {/* Client Info */}
                  <motion.div
                    className={styles.clientInfo}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                  >
                    {/* Client Image */}
                    <motion.div
                      className={styles.clientImageContainer}
                      whileHover={{ scale: 1.05 }}
                    >
                      <img
                        src={testimonials[currentIndex].image}
                        alt={testimonials[currentIndex].author}
                        className={styles.clientImage}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </motion.div>

                    <div className={styles.clientDetails}>
                      <motion.h4
                        className={styles.clientName}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.7 }}
                      >
                        {testimonials[currentIndex].author}
                      </motion.h4>
                      <motion.span
                        className={styles.clientPosition}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.8 }}
                      >
                        {t(`testimonials.items.${testimonials[currentIndex].id}.position`)}
                      </motion.span>
                      <motion.span
                        className={styles.serviceTag}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.9 }}
                      >
                        {t(`testimonials.items.${testimonials[currentIndex].id}.service`)}
                      </motion.span>
                    </div>

                    {/* Rating */}
                    <motion.div
                      className={styles.rating}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 1 }}
                    >
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            duration: 0.3,
                            delay: 1.1 + (i * 0.1)
                          }}
                        >
                          <FaStar className={styles.star} />
                        </motion.div>
                      ))}
                    </motion.div>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right Arrow - Using Feather Icons for cleaner look */}
            <motion.button
              className={`${styles.navArrow} ${styles.rightArrow}`}
              onClick={nextTestimonial}
              whileHover={{ scale: 1.1, x: 3 }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0, x: 20 }}
              animate={isVisible ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.8 }}
              aria-label="Next testimonial"
            >
              <FiArrowRight />
            </motion.button>
          </div>

          {/* Progress Bar */}
          <motion.div
            className={styles.progressBar}
            initial={{ opacity: 0 }}
            animate={isVisible ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <motion.div
              className={styles.progressFill}
              animate={{
                width: `${((currentIndex + 1) / testimonials.length) * 100}%`
              }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;
