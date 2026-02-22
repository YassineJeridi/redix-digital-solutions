// Public Website Layout Wrapper
// Provides Navbar, Footer, AnimatedBackground, and ChatPopup for all public pages
import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ThemeProvider } from '../../context/ThemeContext';
import AnimatedBackground from './components/AnimatedBackground/AnimatedBackground';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import SupportWidget from './components/SupportWidget/SupportWidget';
import LoadingScreen from './components/LoadingScreen/LoadingScreen';
import './i18n'; // Initialize i18next
import './styles/global.css';
import './styles/public-app.css';

const PublicLayoutInner = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { i18n } = useTranslation();

  // Set RTL direction for Arabic
  useEffect(() => {
    const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
    return () => {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
    };
  }, [i18n.language]);

  return (
    <>
      {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
      <div className="app">
        <AnimatedBackground />
        <Navbar />
        <Outlet />
        <Footer />
        <SupportWidget />
      </div>
    </>
  );
};

const PublicLayout = () => (
  <ThemeProvider>
    <PublicLayoutInner />
  </ThemeProvider>
);

export default PublicLayout;
