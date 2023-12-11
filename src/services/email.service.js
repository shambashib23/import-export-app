// const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../config/logger');
const sendGridMail = require('@sendgrid/mail');
sendGridMail.setApiKey(config.email.sendGridApiKey);

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
// const sendEmail = async (to, subject, text) => {
//   const msg = { from: config.email.from, to, subject, text };
//   await transport.sendMail(msg);
// };

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, OTP, templateId) => {
  const message = {
    to: to,
    from: {
      name: 'Sandeep',
      email: 'sandeep.singh@fortmindz.in',
    },
    // subject: 'Reset password',
    // html: `Dear user, OTP to reset your password is ${OTP}`,
    templateId: templateId,
    dynamicTemplateData: {
      OTP: OTP,
    },
  };

  sendGridMail
    .send(message)
    .then((response) => console.log('Email send successfully!'))
    .catch((error) => {
      throw new ApiError(statusCode.BAD_REQUEST, 'Error sending email');
    });

};

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, templateId, dynamicData) => {
  try {
    // SendGrid email message
    const msg = {
      to,
      from: config.email.from,
      templateId,
      dynamic_template_data: dynamicData,
    };

    // Send the email
    await sendGridMail.send(msg);

    console.log('Verification Email sent successfully to:', to);
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

module.exports = {
  // transport,
  // sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
};
