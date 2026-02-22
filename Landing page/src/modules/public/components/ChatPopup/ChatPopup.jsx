// src/components/ChatPopup/ChatPopup.jsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaPaperPlane, FaCheck, FaExclamationTriangle, FaRobot } from 'react-icons/fa';
import { sendTelegramMessage } from '../../services/telegramService';
import styles from './ChatPopup.module.css';

const ChatPopup = ({ isOpen, onClose }) => {
  // ✅ ALL HOOKS MUST BE AT THE TOP - BEFORE ANY EARLY RETURNS
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    selectedService: 'Web Development',
    message: ''
  });
  const [status, setStatus] = useState('idle');
  const messagesEndRef = useRef(null);

  const services = [
    'Web Development',
    'Mobile App Development', 
    'Digital Marketing',
    'Branding & Design',
    'Video Production',
    'E-commerce Solutions',
    'Custom Request'
  ];

  // ✅ ALL useEffect HOOKS MUST BE HERE - BEFORE EARLY RETURNS
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [status]);

  // ✅ NOW SAFE TO DO EARLY RETURN AFTER ALL HOOKS ARE DECLARED
  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    
    try {
      await sendTelegramMessage(formData);
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setFormData({
          name: '',
          email: '',
          phone: '',
          selectedService: 'Web Development',
          message: ''
        });
      }, 3000);
    } catch (error) {
      console.error('Error sending message:', error);
      setStatus('error');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const chatVariants = {
    hidden: {
      opacity: 0,
      x: 400,
      scale: 0.8,
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        duration: 0.6
      }
    },
    exit: {
      opacity: 0,
      x: 400,
      scale: 0.8,
      transition: {
        duration: 0.4,
        ease: "easeInOut"
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className={styles.chatWidget}
        variants={chatVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Chat Header */}
        <div className={styles.chatHeader}>
          <div className={styles.headerInfo}>
            <div className={styles.avatar}>
              <FaRobot />
              <div className={styles.onlineIndicator} />
            </div>
            <div className={styles.headerText}>
              <h4>Redix Support</h4>
              <span className={styles.status}>Online • Typically replies instantly</span>
            </div>
          </div>
          
          <div className={styles.headerActions}>
            <motion.button
              className={styles.closeBtn}
              onClick={onClose}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <FaTimes />
            </motion.button>
          </div>
        </div>

        {/* Chat Body */}
        <motion.div
          className={styles.chatBody}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className={styles.messagesContainer}>
            {/* Welcome Message */}
            <motion.div
              className={styles.welcomeMessage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className={styles.botMessage}>
                <div className={styles.messageAvatar}>
                  <FaRobot />
                </div>
                <div className={styles.messageContent}>
                  <div className={styles.messageBubble}>
                    👋 Hello! Let's help you get started with your project
                  </div>
                  <div className={styles.messageTime}>Just now</div>
                </div>
              </div>
            </motion.div>

            {/* Form Content */}
            {status === 'idle' || status === 'sending' ? (
              <motion.form
                onSubmit={handleSubmit}
                className={styles.chatForm}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Your Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={styles.chatInput}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={styles.chatInput}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className={styles.chatInput}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Service Needed</label>
                  <select
                    name="selectedService"
                    value={formData.selectedService}
                    onChange={handleChange}
                    className={styles.serviceSelect}
                    required
                  >
                    {services.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Message</label>
                  <textarea
                    name="message"
                    placeholder="Describe your request - tell us a bit about your project..."
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="4"
                    className={styles.chatTextarea}
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={status === 'sending'}
                  className={styles.sendBtn}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {status === 'sending' ? (
                    <>
                      <div className={styles.spinner}></div>
                      Sending Request...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane />
                      Send Project Request
                    </>
                  )}
                </motion.button>
              </motion.form>
            ) : status === 'success' ? (
              <motion.div
                className={styles.successState}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className={styles.botMessage}>
                  <div className={styles.messageAvatar}>
                    <FaCheck />
                  </div>
                  <div className={styles.messageContent}>
                    <div className={styles.messageBubble}>
                      ✅ Perfect! We've received your request for <strong>{formData.selectedService}</strong> and will get back to you within 24 hours with a detailed proposal.
                    </div>
                    <div className={styles.messageTime}>Just now</div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                className={styles.errorState}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className={styles.botMessage}>
                  <div className={styles.messageAvatar}>
                    <FaExclamationTriangle />
                  </div>
                  <div className={styles.messageContent}>
                    <div className={styles.messageBubble}>
                      ❌ Oops! Something went wrong. Please try again or contact us directly at contact@redixdigitalsolutions.com
                    </div>
                    <div className={styles.messageTime}>Just now</div>
                  </div>
                </div>
                <button 
                  onClick={() => setStatus('idle')} 
                  className={styles.retryBtn}
                >
                  Try Again
                </button>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </motion.div>

        {/* Floating particles for visual appeal */}
        <div className={styles.floatingParticles}>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className={styles.particle}
              animate={{
                y: [-10, 10, -10],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5
              }}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChatPopup;
