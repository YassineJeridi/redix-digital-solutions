// src/components/Services/ServicesChatPopup.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollLock } from '../../../../hooks/useScrollLock';
import {
  FaTimes, FaUser, FaEnvelope, FaPhone, FaCommentDots,
  FaPaperPlane, FaCheckCircle, FaSpinner, FaExclamationCircle
} from 'react-icons/fa';
import styles from './ServicesChatPopup.module.css';

const ServicesChatPopup = ({ service, onClose }) => {
  useScrollLock(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    budget: '',
    timeline: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [errors, setErrors] = useState({});

  const budgetOptions = [
    '< 500 TND', '500 - 1000 TND', '1000 - 2500 TND',
    '2500 - 5000 TND', '5000+ TND'
  ];

  const timelineOptions = [
    'AS SOON AS POSSIBLE', '1-2 weeks', '1 month', '2-3 months', 'Flexible'
  ];

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      message: `Hi! I'm interested in your ${service.title} service. Could you provide more details?`
    }));
  }, [service]);

  const validateForm = () => {
    const newErrors = {};
    
    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Validate phone (REQUIRED)
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s\+\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Phone number is invalid';
    }
    
    // Validate message
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendToTelegram = async (data) => {
    const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.error('Telegram credentials not configured');
      throw new Error('Telegram configuration missing');
    }

    const message = `
🎯 *New Service Quote Request*

📋 *Service:* ${service.title}
${service.MostPopular ? '⭐ Most Popular Service' : ''}
${service.common ? '💎 Common Service' : ''}

👤 *Client Information:*
• Name: ${data.name}
• Email: ${data.email}
• Phone: ${data.phone}

💰 *Budget:* ${data.budget || 'Not specified'}
⏰ *Timeline:* ${data.timeline || 'Not specified'}

💬 *Message:*
${data.message}

📊 *Service Details:*
${service.description}

💵 *Pricing:* ${service.pricing}

🔗 *Technologies:* ${service.technologies?.join(', ') || 'N/A'}
    `.trim();

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send message to Telegram');
    }

    return response.json();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setSubmitError(false);

    try {
      await sendToTelegram(formData);
      setIsSubmitted(true);
      setTimeout(onClose, 3500);
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const IconComponent = service.icon;

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
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.serviceInfo}>
            <div className={`${styles.iconWrapper} ${service.MostPopular ? styles.popularIcon : ''} ${service.common ? styles.commonIcon : ''}`}>
              <IconComponent />
            </div>
            <div>
              <div className={styles.titleWrapper}>
                <h3>{service.title}</h3>
                {service.MostPopular && <span className={styles.popularBadgeSmall}>Most Popular</span>}
                {service.common && <span className={styles.commonBadgeSmall}>Common</span>}
              </div>
              <p>Get a Custom Quote</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {!isSubmitted && !submitError ? (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                  <label>
                    <FaUser /> Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={errors.name ? styles.error : ''}
                  />
                  {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                </div>

                <div className={styles.inputGroup}>
                  <label>
                    <FaEnvelope /> Email *
                  </label>
                  <input
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={errors.email ? styles.error : ''}
                  />
                  {errors.email && <span className={styles.errorText}>{errors.email}</span>}
                </div>

                <div className={styles.inputGroup}>
                  <label>
                    <FaPhone /> Phone *
                  </label>
                  <input
                    type="tel"
                    placeholder="+216 XX XXX XXX"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={errors.phone ? styles.error : ''}
                  />
                  {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
                </div>

                <div className={styles.inputGroup}>
                  <label>Budget Range</label>
                  <select
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                  >
                    <option value="">Select your budget</option>
                    {budgetOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label>Project Timeline</label>
                  <select
                    value={formData.timeline}
                    onChange={(e) => handleInputChange('timeline', e.target.value)}
                  >
                    <option value="">Select timeline</option>
                    {timelineOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>
                  <FaCommentDots /> Message *
                </label>
                <textarea
                  placeholder="Tell us about your project..."
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  className={errors.message ? styles.error : ''}
                  rows="4"
                />
                {errors.message && <span className={styles.errorText}>{errors.message}</span>}
              </div>

              <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <FaSpinner className={styles.spinner} />
                    Sending to Telegram...
                  </>
                ) : (
                  <>
                    <FaPaperPlane />
                    Send Request
                  </>
                )}
              </button>
            </form>
          ) : isSubmitted ? (
            <div className={styles.successState}>
              <FaCheckCircle className={styles.successIcon} />
              <h3>Request Sent Successfully!</h3>
              <p>Thank you for your interest in our {service.title} service.</p>
              <p>We've received your request via Telegram and will get back to you within 24 hours.</p>
            </div>
          ) : (
            <div className={styles.errorState}>
              <FaExclamationCircle className={styles.errorIcon} />
              <h3>Oops! Something went wrong</h3>
              <p>We couldn't send your request. Please try again or contact us directly.</p>
              <button 
                className={styles.retryBtn} 
                onClick={() => {
                  setSubmitError(false);
                  setIsSubmitting(false);
                }}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ServicesChatPopup;
