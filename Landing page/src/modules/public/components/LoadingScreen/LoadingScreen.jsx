// src/components/LoadingScreen/LoadingScreen.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './LoadingScreen.module.css';

const LoadingScreen = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onComplete?.();
      }, 800);
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={styles.loadingScreen}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          <div className={styles.content}>
            {/* Logo Animation */}
            <motion.div
              className={styles.logoContainer}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                duration: 0.8, 
                ease: [0.16, 1, 0.3, 1]
              }}
            >
              <motion.img
                src="/redix.png"
                alt="Redix"
                className={styles.logo}
                initial={{ filter: 'blur(10px)' }}
                animate={{ filter: 'blur(0px)' }}
                transition={{ duration: 0.6, delay: 0.3 }}
              />
              
              {/* Glow ring */}
              <motion.div
                className={styles.glowRing}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.2, opacity: [0, 0.5, 0] }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeOut'
                }}
              />
            </motion.div>

            {/* Loading bar */}
            <motion.div
              className={styles.loadingBar}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <motion.div
                className={styles.loadingProgress}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ 
                  duration: 2,
                  ease: 'easeInOut'
                }}
              />
            </motion.div>

            {/* Text */}
            <motion.p
              className={styles.loadingText}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              Crafting Digital Experiences
            </motion.p>
          </div>

          {/* Background particles */}
          <div className={styles.particles}>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className={styles.particle}
                initial={{ 
                  x: Math.random() * 100 - 50,
                  y: Math.random() * 100 - 50,
                  opacity: 0 
                }}
                animate={{ 
                  x: Math.random() * 200 - 100,
                  y: Math.random() * 200 - 100,
                  opacity: [0, 0.3, 0]
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 1
                }}
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: `${20 + Math.random() * 60}%`,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;
