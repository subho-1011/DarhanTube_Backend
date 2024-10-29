import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
    registerUser,
    loginUserByEmail,
    logoutUser,
    refreshToken,
    verifyAccessToken,
    changePasswordByOldPassword,
    verifyEmailByOtp,
    sendEmailVerificationOtp,
} from "../controllers/auth.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

const loginAttemptLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: "Too many login attempts, please try again later.",
});

const otpRateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: {
        message: "Too many otp attempts, please try again later.",
        code: 429,
    },
});

router.route("/register").post(loginAttemptLimiter, registerUser);
router.route("/login").post(loginAttemptLimiter, loginUserByEmail);
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/verify-access-token/:accessToken").get(verifyAccessToken);
router.route("/refresh-token").post(refreshToken);

router.route("/change-password").post(verifyJwt, changePasswordByOldPassword);

router.route("/otp/email-verification/verify").post(verifyEmailByOtp);
router.route("/otp/email-verification/send").post(otpRateLimiter, sendEmailVerificationOtp);

export default router;
