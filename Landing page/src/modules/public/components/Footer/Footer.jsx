// src/components/Footer/Footer.jsx
import { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { 
  FaInstagram, 
  FaFacebookF, 
  FaWhatsapp, 
  FaLinkedinIn,
  FaArrowUp,
  FaPaperPlane,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaCode,
  FaMobile,
  FaChartLine,
  FaPalette
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
const logoImage = '/assets/logos/Redix1.png';
import styles from './Footer.module.css';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });
  const { t } = useTranslation();

  // Your actual social media links
  const socialLinks = [
    {
      name: 'Instagram',
      icon: FaInstagram,
      url: 'https://www.instagram.com/redixdigitalsolutions/',
      color: '#E4405F',
      hoverColor: '#C13584'
    },
    {
      name: 'Facebook', 
      icon: FaFacebookF,
      url: 'https://www.facebook.com/profile.php?id=61560535962106',
      color: '#1877F2',
      hoverColor: '#166FE5'
    },
    {
      name: 'WhatsApp',
      icon: FaWhatsapp,
      url: 'https://wa.me/21692861655', // Formatted for WhatsApp link
      color: '#25D366',
      hoverColor: '#128C7E'
    },
    {
      name: 'LinkedIn',
      icon: FaLinkedinIn,
      url: 'https://www.linkedin.com/company/redix-digital-solutions/posts/?feedView=all',
      color: '#0A66C2',
      hoverColor: '#004182'
    }
  ];

  const services = [
    { name: t('footer.webDev'), icon: FaCode },
    { name: t('footer.mobileApps'), icon: FaMobile },
    { name: t('footer.digitalMarketing'), icon: FaChartLine },
    { name: t('footer.uiux'), icon: FaPalette }
  ];

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setEmail('');
      setIsSubmitting(false);
      // You can integrate with your actual newsletter service here
    }, 2000);
  };

  const scrollToTop = () => {
    window.scrollTo({ 
      top: 0, 
      behavior: 'smooth' 
    });
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  const socialIconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: (i) => ({
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.6,
        delay: i * 0.1,
        type: "spring",
        stiffness: 200,
        damping: 15
      }
    }),
    hover: {
      scale: 1.2,
      y: -5,
      rotate: 5,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    }
  };

  return (
    <footer className={styles.footer} ref={sectionRef} id="contact">
      {/* Animated Background Elements */}
      <motion.div 
        className={styles.backgroundGlow1}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.3, 0.1],
          rotate: [0, 180, 360]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      <motion.div 
        className={styles.backgroundGlow2}
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
          rotate: [360, 180, 0]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Floating Particles */}
      <div className={styles.particles}>
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className={styles.particle}
            animate={{
              y: [-20, -100, -20],
              x: [0, Math.random() * 100 - 50, 0],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: Math.random() * 3 + 4,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
          />
        ))}
      </div>

      <motion.div 
        className={styles.container}
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        {/* Main Footer Content */}
        <div className={styles.footerMain}>
          {/* Company Info */}
          <motion.div 
            className={styles.companySection}
            variants={itemVariants}
          >
            <motion.div 
              className={styles.logoContainer}
              whileHover={{ scale: 1.05 }}
            >
              <motion.img
                src={logoImage}
                alt="Redix Digital Solutions"
                className={styles.logo}
                initial={{ scale: 0, rotate: -180 }}
                animate={isInView ? { scale: 1, rotate: 0 } : {}}
                transition={{ duration: 0.8, type: "spring" }}
              />
              <motion.h3 
                className={styles.companyName}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                Redix Digital Solutions
              </motion.h3>
            </motion.div>
            
            <motion.p 
              className={styles.companyDescription}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              {t('footer.companyDesc')}
            </motion.p>

            {/* Animated Social Media Icons */}
            <motion.div 
              className={styles.socialLinks}
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              {socialLinks.map((social, index) => {
                const IconComponent = social.icon;
                return (
                  <motion.a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialLink}
                    variants={socialIconVariants}
                    custom={index}
                    whileHover="hover"
                    style={{ '--social-color': social.color, '--social-hover-color': social.hoverColor }}
                  >
                    <IconComponent />
                    <motion.div 
                      className={styles.socialTooltip}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ opacity: 1, scale: 1 }}
                    >
                      {social.name}
                    </motion.div>
                  </motion.a>
                );
              })}
            </motion.div>
          </motion.div>

          {/* Services Column */}
          <motion.div 
            className={styles.servicesSection}
            variants={itemVariants}
          >
            <motion.h4 
              className={styles.sectionTitle}
              whileHover={{ scale: 1.05, x: 5 }}
            >
              {t('footer.ourServices')}
            </motion.h4>
            <ul className={styles.servicesList}>
              {services.map((service, index) => {
                const IconComponent = service.icon;
                return (
                  <motion.li 
                    key={service.name}
                    className={styles.serviceItem}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                    whileHover={{ x: 10, scale: 1.02 }}
                  >
                    <IconComponent className={styles.serviceIcon} />
                    {service.name}
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div 
            className={styles.contactSection}
            variants={itemVariants}
          >
            <motion.h4 
              className={styles.sectionTitle}
              whileHover={{ scale: 1.05, x: 5 }}
            >
              {t('footer.getInTouch')}
            </motion.h4>
            <div className={styles.contactList}>
              <motion.div 
                className={styles.contactItem}
                whileHover={{ x: 5, scale: 1.02 }}
              >
                <FaMapMarkerAlt className={styles.contactIcon} />
                <span>{t('footer.address')}</span>
              </motion.div>
              <motion.div 
                className={styles.contactItem}
                whileHover={{ x: 5, scale: 1.02 }}
              >
                <FaPhone className={styles.contactIcon} />
                <span>{t('footer.phone')}</span>
              </motion.div>
              <motion.div 
                className={styles.contactItem}
                whileHover={{ x: 5, scale: 1.02 }}
              >
                <FaEnvelope className={styles.contactIcon} />
                <span>{t('footer.emailAddress')}</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Newsletter */}
          <motion.div 
            className={styles.newsletterSection}
            variants={itemVariants}
          >
            <motion.h4 
              className={styles.sectionTitle}
              whileHover={{ scale: 1.05, x: 5 }}
            >
              {t('footer.stayUpdated')}
            </motion.h4>
            <motion.p 
              className={styles.newsletterText}
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              {t('footer.newsletterDesc')}
            </motion.p>
            <motion.form 
              className={styles.newsletterForm}
              onSubmit={handleNewsletterSubmit}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 1.4 }}
            >
              <motion.input
                type="email"
                placeholder={t('footer.enterEmail')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.newsletterInput}
                required
                whileFocus={{ scale: 1.02, borderColor: '#c12de0' }}
              />
              <motion.button
                type="submit"
                className={styles.newsletterBtn}
                disabled={isSubmitting}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isSubmitting ? (
                  <motion.div
                    className={styles.spinner}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <FaPaperPlane />
                )}
              </motion.button>
            </motion.form>
          </motion.div>
        </div>

        {/* Footer Bottom */}
        <motion.div 
          className={styles.footerBottom}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 1.6 }}
        >
          <motion.p 
            className={styles.copyright}
            whileHover={{ scale: 1.02 }}
          >
            {t('footer.copyright')}
          </motion.p>
          
          <motion.button
            className={styles.backToTop}
            onClick={scrollToTop}
            whileHover={{ scale: 1.1, y: -3 }}
            whileTap={{ scale: 0.9 }}
            animate={{
              y: [0, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <FaArrowUp />
          </motion.button>
        </motion.div>
      </motion.div>
    </footer>
  );
};

export default Footer;
