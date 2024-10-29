import bcrypt from "bcryptjs";

/**
 * Generates a random 6-digit OTP and its hashed value.
 * @returns {Promise<Object>} - { otp: string, hashedOtp: string }
 */
export const generateOtp = async () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    return { otp, hashedOtp };
};

/**
 * Verifies an OTP code against its hashed value.
 * @param {string} otpCode - The OTP code to verify.
 * @param {string} hashedOtp - The hashed OTP value.
 * @returns {Promise<boolean>} - True if the OTP code matches the hashed value, false otherwise.
 */
export const verifyOtp = async (otpCode, hashedOtp) => {
    const isOtpMatch = await bcrypt.compare(otpCode.toString(), hashedOtp);
    return isOtpMatch;
};
