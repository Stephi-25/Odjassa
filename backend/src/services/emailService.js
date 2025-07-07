const nodemailer = require('nodemailer'); // Using the mocked nodemailer

let transporter;
let testAccount; // To store Ethereal account details if used

// Configuration for the email service
// Prioritize environment variables for real SMTP, fallback to Ethereal for dev/test
const emailConfig = {
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10) || 587, // Default to 587 (common for TLS)
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Default sender address
  defaultFrom: process.env.EMAIL_FROM || '"Odjassa-Net Support" <no-reply@odjassa.net>',
};

/**
 * Initializes the email transporter.
 * Uses Ethereal for testing if SMTP env vars are not set.
 */
const initializeTransporter = async () => {
  if (transporter) return transporter; // Already initialized

  if (emailConfig.host && emailConfig.auth.user && emailConfig.auth.pass) {
    // Use configured SMTP transport
    console.log('[EmailService] Initializing with configured SMTP:', emailConfig.host);
    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.auth.user,
        pass: emailConfig.auth.pass,
      },
      tls: {
        // Do not fail on invalid certs if using self-signed in dev (not recommended for prod)
        // rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    });
  } else {
    // Fallback to Ethereal for testing if no SMTP config is provided
    console.log('[EmailService] SMTP config not found, creating Ethereal test account...');
    try {
      testAccount = await new Promise((resolve, reject) => {
        nodemailer.createTestAccount((err, account) => {
          if (err) {
            console.error('Failed to create an Ethereal test account. ' + err.message);
            return reject(err);
          }
          resolve(account);
        });
      });

      console.log('[EmailService] Ethereal test account created:', testAccount.user);
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (error) {
      console.error('[EmailService] Could not initialize Ethereal transporter. Email sending will fail.', error);
      // Create a dummy transporter that logs errors but doesn't crash
      transporter = {
        sendMail: async (mailOptions) => {
          console.error('[EmailService Dummy] Email sending skipped due to init failure. Mail options:', mailOptions);
          throw new Error('Email service not initialized.');
        }
      };
    }
  }

  // Verify connection configuration (optional, but good for startup check)
  try {
    if (transporter.verify) { // Real nodemailer transporter has verify
        await transporter.verify();
        console.log('[EmailService] Transporter is ready to send emails.');
    }
  } catch (error) {
    console.error('[EmailService] Transporter verification failed:', error.message);
    // Depending on severity, you might want to prevent app startup or just log
  }

  return transporter;
};

/**
 * Sends an email.
 * @param {object} mailOptions - Options for nodemailer.sendMail
 * @param {string} mailOptions.to - Recipient's email address.
 * @param {string} mailOptions.subject - Subject of the email.
 * @param {string} mailOptions.text - Plain text body of the email.
 * @param {string} mailOptions.html - HTML body of the email.
 * @param {string} [mailOptions.from] - Sender's email address (defaults to emailConfig.defaultFrom).
 * @returns {Promise<object>} Nodemailer info object on success.
 * @throws {Error} If sending fails.
 */
const sendEmail = async ({ to, subject, text, html, from }) => {
  if (!transporter) {
    await initializeTransporter(); // Ensure transporter is initialized
  }

  const mailDefaults = {
    from: from || emailConfig.defaultFrom,
    to,
    subject,
    text,
    html,
  };

  try {
    console.log(`[EmailService] Attempting to send email to ${to} with subject "${subject}"`);
    const info = await transporter.sendMail(mailDefaults);
    console.log('[EmailService] Message sent: %s', info.messageId);

    // If using Ethereal, log the preview URL
    if (testAccount && nodemailer.getTestMessageUrl) { // Check if getTestMessageUrl is available on mocked nodemailer
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('[EmailService] Preview URL (Ethereal): %s', previewUrl);
      }
    }
    return info;
  } catch (error) {
    console.error('[EmailService] Error sending email:', error.message);
    // Log more details for debugging but don't expose too much in thrown error
    // console.error(error);
    throw new Error(`Failed to send email. Reason: ${error.message}`);
  }
};

// Initialize transporter on module load so it's ready.
// This is an async operation, but we don't necessarily need to await it here.
// `sendEmail` will await it if it hasn't completed.
initializeTransporter().catch(err => {
  console.error("[EmailService] Background initialization failed:", err.message);
});


module.exports = {
  sendEmail,
  // initializeTransporter, // Optionally export if manual re-init is needed elsewhere
};
