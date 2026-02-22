// src/components/BookCall/BookCall.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaPhone, FaEnvelope, FaWhatsapp, FaPaperPlane, FaCheckCircle } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import styles from './BookCall.module.css';

// Get configuration from environment variables
const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;
const TELEGRAM_THREAD_ID = import.meta.env.VITE_TELEGRAM_THREAD_WEBSITE_CONTACT;
const WHATSAPP_NUMBER = "21692861655";

const BookCall = () => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        service: 'Web Development',
        projectDetails: ''
    });

    const [status, setStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const serviceOptions = [
        'Web Development',
        'Mobile App Development',
        'Digital Marketing',
        'Video Production',
        'Branding & Design',
        'E-commerce Solutions',
        'Other'
    ];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const sendToTelegram = async () => {
        if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
            console.error('Telegram configuration missing');
            return false;
        }

        const message = `🔥 NEW CONSULTATION REQUEST

👤 **Name:** ${formData.fullName}
📧 **Email:** ${formData.email}
📱 **Phone:** ${formData.phone}
🎯 **Service:** ${formData.service}

💬 **Project Details:**
${formData.projectDetails || 'No details provided'}

📅 **Submitted:** ${new Date().toLocaleString('en-GB', { timeZone: 'Africa/Tunis' })}
🌐 **Source:** Redix Website`;

        try {
            const payload = {
                    chat_id: TELEGRAM_CHAT_ID,
                    text: message,
                    parse_mode: 'Markdown'
                };

            if (TELEGRAM_THREAD_ID) {
                payload.message_thread_id = Number(TELEGRAM_THREAD_ID);
            }

            const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            return response.ok && result.ok;
        } catch (error) {
            console.error('Telegram error:', error);
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus(t('bookCall.sendingRequest'));

        const success = await sendToTelegram();

        if (success) {
            setIsSuccess(true);
            setStatus(t('bookCall.successStatus'));
            setFormData({
                fullName: '',
                email: '',
                phone: '',
                service: 'Web Development',
                projectDetails: ''
            });
        } else {
            setStatus(t('bookCall.errorStatus'));
        }

        setIsLoading(false);
    };

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=Hi Redix Team! I'm ${formData.fullName || '[Your Name]'} and I'm interested in ${formData.service}. I'd like to schedule a free consultation.`;

    if (isSuccess) {
        return (
            <section className={styles.bookCallSection} id="book-call">
                <div className={styles.container}>
                    <motion.div
                        className={styles.successContainer}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <FaCheckCircle className={styles.successIcon} />
                        <h2>{t('bookCall.thankYou')}</h2>
                        <p>{t('bookCall.successMessage')}</p>
                        <div className={styles.contactReminder}>
                            <p>{t('bookCall.needImmediate')}</p>
                            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={styles.whatsappLink}>
                                <FaWhatsapp /> {t('bookCall.messageWhatsApp')}
                            </a>
                        </div>
                        <button
                            onClick={() => setIsSuccess(false)}
                            className={styles.newRequestBtn}
                        >
                            {t('bookCall.continueTour')}
                        </button>
                    </motion.div>
                </div>
            </section>
        );
    }

    return (
        <section className={styles.bookCallSection} id="book-call">
            <div className={styles.container}>
                {/* Header */}
                <motion.div
                    className={styles.header}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                >
                    <h2>{t('bookCall.title')}</h2>
                    <p>{t('bookCall.subtitle')}</p>
                </motion.div>

                <div className={styles.content}>
                    {/* Quick Contact */}
                    <motion.div
                        className={styles.quickContact}
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        viewport={{ once: true }}
                    >
                        <h3>{t('bookCall.chatDirectly')}</h3>
                        <div className={styles.contactOptions}>
                            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={styles.contactBtn}>
                                <FaWhatsapp />
                                <div>
                                    <strong>{t('bookCall.whatsapp')}</strong>
                                    <span>+216 92 861 655</span>
                                </div>
                            </a>
                            <a href="mailto:contact@redixdigitalsolutions.com" className={styles.contactBtn}>
                                <FaEnvelope />
                                <div>
                                    <strong>{t('bookCall.email')}</strong>
                                    <span>contact@redixdigitalsolutions.com</span>
                                </div>
                            </a>
                        </div>
                    </motion.div>

                    {/* Form */}
                    <motion.form
                        onSubmit={handleSubmit}
                        className={styles.form}
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        viewport={{ once: true }}
                    >
                        <h3>{t('bookCall.quickForm')}</h3>

                        <div className={styles.formRow}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="fullName">
                                    {t('bookCall.fullName')} <span>*</span>
                                </label>
                                <input
                                    type="text"
                                    id="fullName"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    required
                                    placeholder={t('bookCall.fullName')}
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label htmlFor="email">
                                    {t('bookCall.emailAddress')} <span>*</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="your@email.com"
                                />
                            </div>
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="phone">
                                    {t('bookCall.phoneNumber')} <span>*</span>
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    placeholder="+216 XX XXX XXX"
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label htmlFor="service">
                                    {t('bookCall.serviceInterested')} <span>*</span>
                                </label>
                                <select
                                    id="service"
                                    name="service"
                                    value={formData.service}
                                    onChange={handleChange}
                                    required
                                >
                                    {serviceOptions.map(service => (
                                        <option key={service} value={service}>{service}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="projectDetails">
                                {t('bookCall.projectDetails')}
                            </label>
                            <textarea
                                id="projectDetails"
                                name="projectDetails"
                                value={formData.projectDetails}
                                onChange={handleChange}
                                placeholder={t('bookCall.projectPlaceholder')}
                                rows="4"
                            />
                        </div>

                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <div className={styles.spinner}></div>
                                    {t('bookCall.sending')}
                                </>
                            ) : (
                                <>
                                    <FaPaperPlane />
                                    {t('bookCall.getFreeConsultation')}
                                </>
                            )}
                        </button>

                        {status && (
                            <div className={`${styles.status} ${status.includes('✅') ? styles.success : styles.error}`}>
                                {status}
                            </div>
                        )}
                    </motion.form>
                </div>
            </div>
        </section>
    );
};

export default BookCall;
