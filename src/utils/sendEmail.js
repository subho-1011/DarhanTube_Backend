import transporter from "../config/nodemailerConfig.js";

/**
 * Utility function to send an email using Nodemailer
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - Email body in HTML format
 * @param {string} [from] - Optional sender email address (defaults to EMAIL_USER)
 * @returns {Promise} - Resolves when the email is successfully sent
 */
export const sendEmail = async (to, subject, html, from = process.env.EMAIL_USER) => {
    const mailOptions = {
        from,
        to,
        subject,
        html,
    };

    try {
        // Send email using transporter
        await transporter.sendMail(mailOptions);
    } catch (error) {
        throw new Error("Email could not be sent");
    }
};

export const emailVerificationMail = async (to, verificationCode) => {
    const subject = "Verify your email address";
    const html = `
    <h1>Verify your email address</h1>
    <p>Please use the following verification code to verify your email address:</p>
    <h2>${verificationCode}</h2>
    `;

    await sendEmail(to, subject, html);
};

export const passwordResetMail = async (to, resetCode) => {
    const subject = "Reset your password";
    const html = `
    <h1>Reset your password</h1>
    <p>Please use the following reset code to reset your password:</p>
    <h2>${resetCode}</h2>
    `;

    await sendEmail(to, subject, html);
};

export const forgotPasswordMail = async (to, resetCode) => {
    const subject = "Reset your password";
    const html = `
    <h1>Reset your password</h1>
    <p>Please use the following reset code to reset your password:</p>
    <h2>${resetCode}</h2>
    `;

    await sendEmail(to, subject, html);
};
