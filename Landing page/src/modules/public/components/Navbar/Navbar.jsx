// src/components/Navbar/Navbar.jsx

import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBars, FaTimes, FaUser, FaCog, FaBriefcase, FaEnvelope, FaEye, FaCouch, FaPlane, FaTshirt, FaUtensils, FaChevronDown, FaSun, FaMoon, FaGlobe } from 'react-icons/fa';
import { useTheme } from '../../../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import styles from './Navbar.module.css';

const logoImage = '/assets/logos/Redix1.png';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [isWorkOpen, setIsWorkOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();

  const languages = [
    { code: 'en', label: '🇬🇧 English' },
    { code: 'fr', label: '🇫🇷 Français' },
    { code: 'ar', label: '🇸🇦 العربية' }
  ];

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setIsLangOpen(false);
  };

  const workItems = [
    { label: t('nav.quickOverview'), href: '/#video-showcase', icon: FaEye, isHash: true },
    { label: t('nav.furniture'), href: '/furniture', icon: FaCouch, isHash: false },
    { label: t('nav.travelAgency'), href: '/travel', icon: FaPlane, isHash: false },
    { label: t('nav.fashion'), href: '/fashion', icon: FaTshirt, isHash: false },
    { label: t('nav.chef'), href: '/chef', icon: FaUtensils, isHash: false }
  ];

  const navItems = [
    { id: 'why-choose-us', label: t('nav.about'), href: '/#why-choose-us', icon: FaUser, isHash: true },
    { id: 'services', label: t('nav.services'), href: '/#services', icon: FaCog, isHash: true },
    { id: 'our-work', label: t('nav.ourWork'), icon: FaBriefcase, hasDropdown: true },
    { id: 'book-call', label: t('nav.contact'), href: '/#book-call', icon: FaEnvelope, isHash: true }
  ];

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      
      if (location.pathname === '/') {
        const sections = navItems.filter(item => !item.hasDropdown).map(item => item.id);
        const currentSection = sections.find(section => {
          const element = document.getElementById(section);
          if (element) {
            const rect = element.getBoundingClientRect();
            return rect.top <= 100 && rect.bottom >= 100;
          }
          return false;
        });
        
        if (currentSection) setActiveSection(currentSection);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname, navItems]);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      window.scrollTo({ top: element.offsetTop - 80, behavior: 'smooth' });
    }
    setIsOpen(false);
    setIsWorkOpen(false);
  };

  const handleNavClick = (e, item) => {
    if (item.isHash && location.pathname === '/') {
      e.preventDefault();
      scrollToSection(item.id);
    }
  };

  const handleWorkItemClick = (item) => {
    setIsWorkOpen(false);
    setIsOpen(false);
    if (item.isHash && location.pathname === '/') {
      const sectionId = item.href.replace('/#', '');
      scrollToSection(sectionId);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(`.${styles.navbar}`)) {
        setIsOpen(false);
        setIsWorkOpen(false);
        setIsLangOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
    setIsWorkOpen(false);
  }, [location.pathname]);

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        {/* Logo */}
        <Link to="/" className={styles.logo} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src={logoImage} alt="Redix Solutions" className={styles.logoImage} />
        </Link>

        {/* Desktop Nav */}
        <ul className={styles.navLinks}>
          {navItems.map((item) => {
            const Icon = item.icon;

            if (item.hasDropdown) {
              return (
                <li key={item.id} className={styles.dropdown}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsWorkOpen(!isWorkOpen); }}
                    className={`${styles.navLink} ${isWorkOpen ? styles.active : ''}`}
                  >
                    <Icon />
                    {item.label}
                    <FaChevronDown className={`${styles.chevron} ${isWorkOpen ? styles.rotated : ''}`} />
                  </button>
                  
                  {isWorkOpen && (
                    <div className={styles.dropdownMenu}>
                      {workItems.map((work) => {
                        const WorkIcon = work.icon;
                        return (
                          <Link
                            key={work.label}
                            to={work.href}
                            onClick={() => handleWorkItemClick(work)}
                            className={styles.dropdownItem}
                          >
                            <WorkIcon />
                            {work.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </li>
              );
            }

            return (
              <li key={item.id}>
                <Link
                  to={item.href}
                  onClick={(e) => handleNavClick(e, item)}
                  className={`${styles.navLink} ${activeSection === item.id ? styles.active : ''}`}
                >
                  <Icon />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Theme Toggle */}
        <button
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label={isDark ? t('nav.switchToLight') : t('nav.switchToDark')}
          title={isDark ? t('nav.lightMode') : t('nav.darkMode')}
        >
          <motion.span
            key={isDark ? 'moon' : 'sun'}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            {isDark ? <FaMoon /> : <FaSun />}
          </motion.span>
        </button>

        {/* Language Switcher */}
        <div className={styles.langSwitcher}>
          <button
            className={styles.langToggle}
            onClick={(e) => { e.stopPropagation(); setIsLangOpen(!isLangOpen); }}
            aria-label="Change language"
          >
            <FaGlobe />
            <span className={styles.langCode}>{i18n.language.toUpperCase()}</span>
          </button>
          {isLangOpen && (
            <div className={styles.langDropdown}>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  className={`${styles.langOption} ${i18n.language === lang.code ? styles.langActive : ''}`}
                  onClick={() => changeLanguage(lang.code)}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className={styles.menuToggle}
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          aria-label={t('nav.toggleMenu')}
        >
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Mobile Menu */}
      {/* Mobile Menu */}
<AnimatePresence>
  {isOpen && (
    <>
      <motion.div
        className={styles.backdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setIsOpen(false)}
      />
      <motion.div
        className={styles.mobileMenu}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
      >
        <ul className={styles.mobileNavLinks}>
          {navItems.map((item) => {
            const Icon = item.icon;
            
            if (item.hasDropdown) {
              return (
                <li key={item.id}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsWorkOpen(!isWorkOpen); }}
                    className={`${styles.mobileNavLink} ${isWorkOpen ? styles.activeLink : ''}`}
                  >
                    <Icon />
                    {item.label}
                    <FaChevronDown className={`${styles.chevron} ${isWorkOpen ? styles.rotated : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isWorkOpen && (
                      <motion.div
                        className={styles.subMenu}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {workItems.map((work) => {
                          const WorkIcon = work.icon;
                          return (
                            <Link
                              key={work.label}
                              to={work.href}
                              onClick={() => handleWorkItemClick(work)}
                              className={styles.subMenuItem}
                            >
                              <WorkIcon />
                              {work.label}
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            }
            
            return (
              <li key={item.id}>
                <Link
                  to={item.href}
                  onClick={(e) => { handleNavClick(e, item); setIsOpen(false); }}
                  className={`${styles.mobileNavLink} ${activeSection === item.id ? styles.activeLink : ''}`}
                >
                  <Icon />
                  {item.label}
                  {activeSection === item.id && location.pathname === '/' && (
                    <span className={styles.activeDot} />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </motion.div>
    </>
  )}
</AnimatePresence>

    </nav>
  );
};

export default Navbar;
