// src/components/SupportWidget/SupportWidget.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCommentDots, FaTimes, FaUser, FaPhone, FaPaperPlane,
  FaCheckCircle, FaSpinner, FaExclamationCircle, FaHeadset
} from 'react-icons/fa';
import { sendSupportMessage } from '../../services/telegramService';
import styles from './SupportWidget.module.css';

const SupportWidget = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | sending | success | error

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.phone.trim()) e.phone = 'Required';
    if (!form.message.trim()) e.message = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus('sending');
    try {
      await sendSupportMessage(form);
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setForm({ name: '', phone: '', message: '' });
        setOpen(false);
      }, 2500);
    } catch {
      setStatus('error');
    }
  };

  const set = (field, val) => {
    setForm(p => ({ ...p, [field]: val }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }));
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        className={styles.fab}
        onClick={() => setOpen(prev => !prev)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open support chat"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <FaTimes />
            </motion.span>
          ) : (
            <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <FaCommentDots />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Popup */}
      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.popup}
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Popup Header */}
            <div className={styles.popupHeader}>
              <div className={styles.headerInfo}>
                <FaHeadset className={styles.headerIcon} />
                <div>
                  <h4 className={styles.headerTitle}>Redix Support</h4>
                  <span className={styles.headerStatus}>
                    <span className={styles.onlineDot} /> Online
                  </span>
                </div>
              </div>
              <button className={styles.popupClose} onClick={() => setOpen(false)} aria-label="Close">
                <FaTimes />
              </button>
            </div>

            {/* Body */}
            <div className={styles.popupBody}>
              <AnimatePresence mode="wait">
                {status === 'success' ? (
                  <motion.div
                    key="ok"
                    className={styles.successBlock}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <FaCheckCircle className={styles.successIco} />
                    <p>Message sent! We'll reply soon.</p>
                  </motion.div>
                ) : (
                  <motion.form key="form" className={styles.form} onSubmit={handleSubmit} initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {/* Name */}
                    <div className={`${styles.inputWrap} ${errors.name ? styles.inputErr : ''}`}>
                      <FaUser className={styles.ico} />
                      <input
                        placeholder="Name"
                        value={form.name}
                        onChange={(e) => set('name', e.target.value)}
                        className={styles.input}
                      />
                    </div>

                    {/* Phone */}
                    <div className={`${styles.inputWrap} ${errors.phone ? styles.inputErr : ''}`}>
                      <FaPhone className={styles.ico} />
                      <input
                        placeholder="Phone"
                        value={form.phone}
                        onChange={(e) => set('phone', e.target.value)}
                        className={styles.input}
                      />
                    </div>

                    {/* Message */}
                    <div className={`${styles.inputWrap} ${styles.inputWrapTa} ${errors.message ? styles.inputErr : ''}`}>
                      <textarea
                        placeholder="Your message..."
                        value={form.message}
                        onChange={(e) => set('message', e.target.value)}
                        className={`${styles.input} ${styles.ta}`}
                        rows={3}
                      />
                    </div>

                    {status === 'error' && (
                      <div className={styles.errBanner}>
                        <FaExclamationCircle /> Send failed — retry.
                      </div>
                    )}

                    <button type="submit" className={styles.sendBtn} disabled={status === 'sending'}>
                      {status === 'sending' ? (
                        <FaSpinner className={styles.spin} />
                      ) : (
                        <><FaPaperPlane /> Send</>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SupportWidget;
