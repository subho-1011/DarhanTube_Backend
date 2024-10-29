import mongoose from "mongoose";

const OTP_EXPIRY = 10 * 60 * 1000;

const verifyEmailOtpSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            match: [/\S+@\S+\.\S+/, "Please use a valid email address"],
        },
        otp: {
            type: String,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            default: () => new Date(Date.now() + OTP_EXPIRY),
        },
    },
    { timestamps: true }
);

const resetPasswordOtpSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            match: [/\S+@\S+\.\S+/, "Please use a valid email address"],
        },
        otp: {
            type: String,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            default: () => new Date(Date.now() + OTP_EXPIRY),
        },
    },
    { timestamps: true }
);

const forgotPasswordOtpSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            match: [/\S+@\S+\.\S+/, "Please use a valid email address"],
        },
        otp: {
            type: String,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            default: () => new Date(Date.now() + OTP_EXPIRY),
        },
    },
    { timestamps: true }
);

const VerifyEmailOtp = mongoose.model("VerifyEmailOtp", verifyEmailOtpSchema);

const ResetPasswordOtp = mongoose.model("ResetPasswordOtp", resetPasswordOtpSchema);

const ForgotPasswordOtp = mongoose.model("ForgotPasswordOtp", forgotPasswordOtpSchema);

export { VerifyEmailOtp, ResetPasswordOtp, ForgotPasswordOtp };
