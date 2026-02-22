// src/services/telegramService.js
const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;
const THREAD_WEBSITE_CONTACT = import.meta.env.VITE_TELEGRAM_THREAD_WEBSITE_CONTACT;

/**
 * Low-level sender — all Telegram messages go through here.
 * If threadId is provided the message is posted into that forum topic.
 */
const sendTelegram = async (text, threadId) => {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('Telegram configuration missing');
    throw new Error('Service configuration error');
  }

  const body = {
    chat_id: TELEGRAM_CHAT_ID,
    text,
    parse_mode: 'Markdown',
  };

  // Add thread / topic if available
  if (threadId) {
    body.message_thread_id = Number(threadId);
  }

  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    throw new Error(`Telegram HTTP ${response.status}`);
  }

  return response.json();
};

/**
 * Chat-popup inquiry (existing flow).
 */
export const sendTelegramMessage = async (formData) => {
  const { name, email, phone, selectedService, message } = formData;

  const text = `
🚀 *NEW INQUIRY - REDIX DIGITAL*

👤 *Client Details:*
• Name: ${name}
• Email: ${email}
• Phone: ${phone}

🛠️ *Service:* ${selectedService}

💬 *Message:*
${message}

📅 *Time:* ${new Date().toLocaleString()}
⚡ *Source:* Website Chat
  `.trim();

  return sendTelegram(text, THREAD_WEBSITE_CONTACT);
};

/**
 * Service Booking (from BookingModal).
 */
export const sendBookingMessage = async ({ name, email, phone, project, serviceName }) => {
  const text = `
🚀 *New Service Booking*

👤 *Name:* ${name}
📧 *Email:* ${email}
📱 *Phone:* ${phone}
🛠 *Service:* ${serviceName}

📝 *Project Details:*
${project || 'Not provided'}

📅 *Time:* ${new Date().toLocaleString()}
⚡ *Source:* Service Booking Modal
  `.trim();

  return sendTelegram(text, THREAD_WEBSITE_CONTACT);
};

/**
 * Support request (from SupportWidget).
 */
export const sendSupportMessage = async ({ name, phone, message }) => {
  const text = `
💬 *New Support Request*

👤 *User:* ${name}
📱 *Phone:* ${phone}

📝 *Message:*
${message}

📅 *Time:* ${new Date().toLocaleString()}
⚡ *Source:* Support Widget
  `.trim();

  return sendTelegram(text, THREAD_WEBSITE_CONTACT);
};

export default sendTelegramMessage;
