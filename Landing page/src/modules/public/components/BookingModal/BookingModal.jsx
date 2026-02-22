// src/components/BookingModal/BookingModal.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollLock } from '../../../../hooks/useScrollLock';
import {
  FaTimes, FaPaperPlane, FaCheckCircle, FaSpinner, FaExclamationCircle,
  FaRocket, FaStar, FaShieldAlt
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { sendBookingMessage } from '../../services/telegramService';
import styles from './BookingModal.module.css';

const serviceTypes = [
  'Web Development',
  'Mobile App Development',
  'Digital Marketing',
  'Video Production',
  'Branding & Design',
  'E-commerce Solutions',
  'UI/UX Design',
  'Other'
];

const BookingModal = ({ service, onClose }) => {
  useScrollLock(true);
  const { t } = useTranslation();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    serviceType: service?.title || serviceTypes[0],
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [focused, setFocused] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = t('booking.nameRequired');
    if (!form.email.trim()) e.email = t('booking.emailRequired');
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = t('booking.invalidEmail');
    if (!form.phone.trim()) e.phone = t('booking.phoneRequired');
    else if (!/^[\d\s+\-()]{7,}$/.test(form.phone)) e.phone = t('booking.invalidPhone');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus('sending');
    try {
      await sendBookingMessage({
        name: form.name,
        email: form.email,
        phone: form.phone,
        project: form.message,
        serviceName: form.serviceType
      });
      setStatus('success');
      setTimeout(onClose, 3000);
    } catch {
      setStatus('error');
    }
  };

  const set = (field, val) => {
    setForm(p => ({ ...p, [field]: val }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }));
  };

  const isActive = (field) => focused[field] || form[field];

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className={styles.modal}
        initial={{ scale: 0.9, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 40 }}
        transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
      >
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <FaTimes />
        </button>

        <AnimatePresence mode="wait">
          {status === 'success' ? (
            <motion.div
              key="success"
              className={styles.successState}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
            >
              <div className={styles.successPulse}>
                <FaCheckCircle className={styles.successIcon} />
              </div>
              <h3>{t('booking.confirmed')}</h3>
              <p>{t('booking.confirmedMsg')}</p>
            </motion.div>
          ) : (
            <motion.div key="form" className={styles.twoCol} initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Left: Form */}
              <div className={styles.formSide}>
                <div className={styles.formHeader}>
                  <h3 className={styles.modalTitle}>{t('booking.title')}</h3>
                  <p className={styles.modalSubtitle}>{t('booking.subtitle')}</p>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                  {/* Name */}
                  <div className={`${styles.floatingGroup} ${errors.name ? styles.hasError : ''}`}>
                    <input
                      type="text"
                      id="booking-name"
                      value={form.name}
                      onChange={(e) => set('name', e.target.value)}
                      onFocus={() => setFocused(p => ({ ...p, name: true }))}
                      onBlur={() => setFocused(p => ({ ...p, name: false }))}
                      className={`${styles.floatingInput} ${isActive('name') ? styles.filled : ''}`}
                      autoComplete="name"
                    />
                    <label htmlFor="booking-name" className={styles.floatingLabel}>{t('booking.fullName')}</label>
                    {errors.name && <span className={styles.fieldError}>{errors.name}</span>}
                  </div>

                  {/* Phone */}
                  <div className={`${styles.floatingGroup} ${errors.phone ? styles.hasError : ''}`}>
                    <input
                      type="tel"
                      id="booking-phone"
                      value={form.phone}
                      onChange={(e) => set('phone', e.target.value)}
                      onFocus={() => setFocused(p => ({ ...p, phone: true }))}
                      onBlur={() => setFocused(p => ({ ...p, phone: false }))}
                      className={`${styles.floatingInput} ${isActive('phone') ? styles.filled : ''}`}
                      autoComplete="tel"
                    />
                    <label htmlFor="booking-phone" className={styles.floatingLabel}>{t('booking.phone')}</label>
                    {errors.phone && <span className={styles.fieldError}>{errors.phone}</span>}
                  </div>

                  {/* Email */}
                  <div className={`${styles.floatingGroup} ${errors.email ? styles.hasError : ''}`}>
                    <input
                      type="email"
                      id="booking-email"
                      value={form.email}
                      onChange={(e) => set('email', e.target.value)}
                      onFocus={() => setFocused(p => ({ ...p, email: true }))}
                      onBlur={() => setFocused(p => ({ ...p, email: false }))}
                      className={`${styles.floatingInput} ${isActive('email') ? styles.filled : ''}`}
                      autoComplete="email"
                    />
                    <label htmlFor="booking-email" className={styles.floatingLabel}>{t('booking.email')}</label>
                    {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
                  </div>

                  {/* Service Type */}
                  <div className={styles.floatingGroup}>
                    <select
                      id="booking-service"
                      value={form.serviceType}
                      onChange={(e) => set('serviceType', e.target.value)}
                      className={`${styles.floatingInput} ${styles.floatingSelect} ${styles.filled}`}
                    >
                      {serviceTypes.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <label htmlFor="booking-service" className={styles.floatingLabel}>{t('booking.serviceType')}</label>
                  </div>

                  {/* Message */}
                  <div className={styles.floatingGroup}>
                    <textarea
                      id="booking-message"
                      value={form.message}
                      onChange={(e) => set('message', e.target.value)}
                      onFocus={() => setFocused(p => ({ ...p, message: true }))}
                      onBlur={() => setFocused(p => ({ ...p, message: false }))}
                      className={`${styles.floatingInput} ${styles.floatingTextarea} ${isActive('message') ? styles.filled : ''}`}
                      rows={3}
                    />
                    <label htmlFor="booking-message" className={`${styles.floatingLabel} ${styles.textareaLabel}`}>
                      {t('booking.message')}
                    </label>
                  </div>

                  {status === 'error' && (
                    <div className={styles.errorBanner}>
                      <FaExclamationCircle /> {t('booking.errorMsg')}
                    </div>
                  )}

                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={status === 'sending'}
                  >
                    {status === 'sending' ? (
                      <><FaSpinner className={styles.spin} /> {t('booking.sending')}</>
                    ) : (
                      <><FaPaperPlane /> {t('booking.bookNow')}</>
                    )}
                  </button>
                </form>
              </div>

              {/* Right: Summary / Illustration */}
              <div className={styles.summarySide}>
                <div className={styles.summaryContent}>
                  <div className={styles.summaryIllustration}>
                    <div className={styles.glowOrb} />
                    <FaRocket className={styles.summaryMainIcon} />
                  </div>

                  <h4 className={styles.summaryTitle}>
                    {service?.title || t('booking.getStarted')}
                  </h4>
                  <p className={styles.summaryDesc}>
                    {t('booking.summaryDesc')}
                  </p>

                  <div className={styles.summaryFeatures}>
                    <div className={styles.summaryFeature}>
                      <FaStar className={styles.featureIcon} />
                      <span>{t('booking.freeConsultation')}</span>
                    </div>
                    <div className={styles.summaryFeature}>
                      <FaShieldAlt className={styles.featureIcon} />
                      <span>{t('booking.noCommitment')}</span>
                    </div>
                    <div className={styles.summaryFeature}>
                      <FaRocket className={styles.featureIcon} />
                      <span>{t('booking.fastTurnaround')}</span>
                    </div>
                  </div>

                  <div className={styles.summaryStats}>
                    <div className={styles.statItem}>
                      <span className={styles.statNum}>100+</span>
                      <span className={styles.statLabel}>{t('booking.projects')}</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statNum}>50+</span>
                      <span className={styles.statLabel}>{t('booking.clients')}</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statNum}>24h</span>
                      <span className={styles.statLabel}>{t('booking.response')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default BookingModal;
