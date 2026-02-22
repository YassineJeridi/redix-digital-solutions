// src/components/Banner/Banner.jsx
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
const logoImage = '/assets/logos/Redix1.png';
const worldIcon = '/assets/icons/world.png';
const securityIcon = '/assets/icons/security.png';
const moonIcon = '/assets/icons/moon.png';
const tunisiaIcon = '/assets/icons/tunisia.png';
const videoEditingIcon = '/assets/icons/video editing.png';
import styles from './Banner.module.css';

const Banner = () => {
  const bannerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { t } = useTranslation();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (bannerRef.current) {
      observer.observe(bannerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Mouse move effect for interactive background
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const scrollToContact = () => {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToServices = () => {
    const element = document.getElementById('services');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className={`${styles.banner} ${isVisible ? styles.animate : ''}`} ref={bannerRef} id="home">
      {/* Floating Background Icons - World, Security, Moon, Tunisia */}
      <div className={styles.floatingIcons}>
        <motion.img 
          src={worldIcon} 
          alt="" 
          className={styles.floatingIcon}
          style={{ top: '15%', left: '8%' }}
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img 
          src={securityIcon} 
          alt="" 
          className={styles.floatingIcon}
          style={{ top: '25%', right: '8%' }}
          animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.img 
          src={moonIcon} 
          alt="" 
          className={styles.floatingIcon}
          style={{ bottom: '25%', left: '6%' }}
          animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.img 
          src={tunisiaIcon} 
          alt="" 
          className={styles.floatingIcon}
          style={{ bottom: '20%', right: '6%' }}
          animate={{ y: [0, 12, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        <motion.img 
          src={videoEditingIcon} 
          alt="" 
          className={styles.floatingIcon}
          style={{ top: '50%', left: '3%' }}
          animate={{ y: [0, -18, 0], rotate: [0, -8, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
        />
        {/* Smaller duplicates for depth */}
        <motion.img 
          src={worldIcon} 
          alt="" 
          className={`${styles.floatingIcon} ${styles.small}`}
          style={{ top: '60%', left: '12%' }}
          animate={{ y: [0, 10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        />
        <motion.img 
          src={moonIcon} 
          alt="" 
          className={`${styles.floatingIcon} ${styles.small}`}
          style={{ top: '45%', right: '12%' }}
          animate={{ y: [0, -10, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
        />
      </div>

      {/* Background Animations */}
      <div className={styles.backgroundAnimations}>
        {/* Animated Grid */}
        <div className={styles.animatedGrid}></div>

        {/* Floating Geometric Shapes */}
        <div className={styles.geometricShapes}>
          <div className={styles.triangle}></div>
          <div className={styles.square}></div>
          <div className={styles.hexagon}></div>
          <div className={styles.circle}></div>
          <div className={styles.diamond}></div>
        </div>

        {/* Morphing Blobs */}
        <div className={styles.morphingBlobs}>
          <div className={styles.blob1}></div>
          <div className={styles.blob2}></div>
          <div className={styles.blob3}></div>
        </div>

        {/* Animated Wave Lines */}
        <div className={styles.waveLines}>
          <svg className={styles.wave} viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,60 C300,120 900,0 1200,60 L1200,0 L0,0 Z" className={styles.wavePath1} />
          </svg>
          <svg className={styles.wave} viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,80 C300,20 900,140 1200,80 L1200,0 L0,0 Z" className={styles.wavePath2} />
          </svg>
        </div>

        {/* Interactive Mouse Follower */}
        <div
          className={styles.mouseFollower}
          style={{
            transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.3}px)`
          }}
        ></div>

        {/* Floating Energy Orbs */}
        <div className={styles.energyOrbs}>
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`${styles.energyOrb} ${styles[`orb${i + 1}`]}`}></div>
          ))}
        </div>

        {/* Animated Lines Network */}
        <div className={styles.linesNetwork}>
          <svg className={styles.networkSvg} viewBox="0 0 1200 800">
            <g className={styles.networkLines}>
              <line x1="0" y1="100" x2="300" y2="200" className={styles.networkLine} />
              <line x1="300" y1="200" x2="600" y2="150" className={styles.networkLine} />
              <line x1="600" y1="150" x2="900" y2="300" className={styles.networkLine} />
              <line x1="900" y1="300" x2="1200" y2="100" className={styles.networkLine} />
              <line x1="100" y1="400" x2="500" y2="500" className={styles.networkLine} />
              <line x1="500" y1="500" x2="800" y2="400" className={styles.networkLine} />
              <line x1="800" y1="400" x2="1100" y2="600" className={styles.networkLine} />
            </g>
            <g className={styles.networkNodes}>
              <circle cx="0" cy="100" r="3" className={styles.networkNode} />
              <circle cx="300" cy="200" r="4" className={styles.networkNode} />
              <circle cx="600" cy="150" r="3" className={styles.networkNode} />
              <circle cx="900" cy="300" r="5" className={styles.networkNode} />
              <circle cx="1200" cy="100" r="3" className={styles.networkNode} />
              <circle cx="100" cy="400" r="4" className={styles.networkNode} />
              <circle cx="500" cy="500" r="3" className={styles.networkNode} />
              <circle cx="800" cy="400" r="4" className={styles.networkNode} />
              <circle cx="1100" cy="600" r="3" className={styles.networkNode} />
            </g>
          </svg>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>
            {t('banner.title')}
            <span className={styles.highlight}>{t('banner.highlight')}</span>
          </h1>
          <p className={styles.subtitle}>
            {t('banner.subtitle')}
          </p>
          <div className={styles.ctaButtons}>
            <button className={styles.primaryBtn} onClick={scrollToContact}>
              {t('banner.getStarted')}
            </button>
            <button className={styles.secondaryBtn} onClick={scrollToServices}>
              {t('banner.viewWork')}
            </button>
          </div>
        </div>

        <div className={styles.visual}>
          {/* Animated Logo */}
          <div className={styles.logoContainer}>
            <img
              src={logoImage}
              alt="Redix Digital Solutions"
              className={styles.logo}
            />
            <div className={styles.logoGlow}></div>
            <div className={styles.logoRings}>
              <div className={styles.ring}></div>
              <div className={styles.ring}></div>
              <div className={styles.ring}></div>
            </div>
          </div>

          {/* Enhanced Visual Elements */}
          <div className={styles.floatingElement}></div>
          <div className={styles.gradient}></div>
          <div className={styles.particles}>
            {[...Array(25)].map((_, i) => (
              <div key={i} className={styles.particle}></div>
            ))}
          </div>

          {/* Additional Decorative Elements */}
          <div className={styles.orbs}>
            <div className={styles.orb}></div>
            <div className={styles.orb}></div>
            <div className={styles.orb}></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Banner;
