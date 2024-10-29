import jwt from "jsonwebtoken";

import User from "../models/user.model.js";

import {
    LoginFormSchema,
    RegisterFormSchema,
    ChangePasswordFormSchema,
    EmailVerificationFormSchema,
} from "../validators/user-validations.js";
import {
    ApiErrorResponse,
    ApiReridectResponse,
    ApiSuccessResponse,
} from "../utils/handleApiResponse.js";

import {
    emailVerificationMail,
    forgotPasswordMail,
    passwordResetMail,
} from "../utils/sendEmail.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Profile from "../models/profile.model.js";
import UserSettings from "../models/userSettings.model.js";
import { generateOtp, verifyOtp } from "../utils/otp.js";
import { VerifyEmailOtp, ResetPasswordOtp, ForgotPasswordOtp } from "../models/userOtp.model.js";

// register user
const registerUser = asyncHandler(async (req, res) => {
    const { data, error } = RegisterFormSchema.safeParse(req.body);
    if (error) {
        throw ApiErrorResponse.fromZodError(error);
    }

    const { name, username, email, password } = data;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
        const errorMessage =
            existingUser.email === email ? "Email already exists" : "Username already exists";
        throw new ApiErrorResponse(400, errorMessage);
    }

    const newUser = await User.create({ name, username, email, password });

    const { otp, hashedOtp } = await generateOtp();

    await VerifyEmailOtp.create({ email, otp: hashedOtp });
    await emailVerificationMail(email, otp);

    res.status(201).json(
        new ApiSuccessResponse(201, "User created successfully", { user: newUser.toJSON() })
    );

    await Profile.create({ owner: newUser._id, firstName: name.split(" ")[0] });
    await UserSettings.create({ owner: newUser._id });
});

// login user
const loginUserByEmail = asyncHandler(async (req, res) => {
    const { email, password } = LoginFormSchema.parse(req.body);

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        throw new ApiErrorResponse(404, "User not found");
    }

    const isPasswordCorrect = await user.isPasswordMatch(password);
    if (!isPasswordCorrect) {
        throw new ApiErrorResponse(401, "Invalid credentials");
    }

    if (!user.isVerified) {
        return res
            .status(301)
            .json(new ApiReridectResponse(301, "Email not verified", "/auth/verify-email"));
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    await User.findOneAndUpdate({ _id: user._id }, { $set: { refreshToken } }, { new: true });

    const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new ApiSuccessResponse(200, "Login successful", { user: user.toJSON() }));
});

// logout user
const logoutUser = async (req, res) => {
    if (!req.user) {
        throw new ApiErrorResponse(401, "User not found, unauthorized access");
    }

    // delete refresh token from database
    const user = await User.findOneAndUpdate(
        { _id: req.user._id },
        { $unset: { refreshToken: 1 } },
        { new: true }
    );

    if (!user) {
        throw new ApiErrorResponse(401, "User not found, unauthorized access");
    }

    // clear cookies
    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
    };

    res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiSuccessResponse(200, "Logout successful"));
};

// refresh token
const refreshToken = asyncHandler(async (req, res) => {
    const refreshTokenFromRequest = req.cookies.refreshToken ?? req.body.refreshToken;
    if (!refreshTokenFromRequest) {
        throw new ApiErrorResponse(401, "Refresh token not found, unauthorized access");
    }

    const decodedRefreshToken = jwt.verify(
        refreshTokenFromRequest,
        process.env.REFRESH_TOKEN_SECRET
    );
    if (!decodedRefreshToken) {
        throw new ApiErrorResponse(401, "Refresh token invalid, unauthorized access");
    }

    const user = await User.findById(decodedRefreshToken._id);
    if (!user) {
        throw new ApiErrorResponse(401, "User not found, unauthorized access");
    }

    if (user.refreshToken !== refreshTokenFromRequest) {
        throw new ApiErrorResponse(401, "Refresh token invalid, unauthorized access");
    }

    const newAccessToken = user.generateAccessToken();
    // const newRefreshToken = user.generateRefreshToken();

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
    };

    return res
        .status(200)
        .cookie("accessToken", newAccessToken, options)
        .json(new ApiSuccessResponse(200, "Refresh token successful", { user: user.toJSON() }));
});

// verify access token
const verifyAccessToken = asyncHandler(async (req, res) => {
    const accessToken = req.params.accessToken;

    if (!accessToken) {
        throw new ApiErrorResponse(401, "Access token not provided");
    }

    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded._id);

    if (!user) {
        throw new ApiErrorResponse(401, "Unauthorized: user not found");
    }

    return res.status(200).json(new ApiSuccessResponse(200, "Access token verified"));
});

// change password
const changePasswordByOldPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = ChangePasswordFormSchema.parse(req.body);

    const user = await User.findById(req.user?._id).select("+password");
    if (!user) {
        throw new ApiErrorResponse(404, "User not found while changing password");
    }

    const isPasswordMatch = await user.isPasswordMatch(oldPassword);
    if (!isPasswordMatch) {
        throw new ApiErrorResponse(400, "Old password is incorrect");
    }

    if (newPassword !== confirmPassword) {
        throw new ApiErrorResponse(400, "New password and confirm password do not match");
    }

    if (newPassword === oldPassword) {
        throw new ApiErrorResponse(400, "New password cannot be same as old password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiSuccessResponse(200, "Password changed successfully"));
});

// email verification by otp
const verifyEmailByOtp = asyncHandler(async (req, res) => {
    const { error, data } = EmailVerificationFormSchema.safeParse(req.body);

    if (error) {
        throw ApiErrorResponse.fromZodError(error);
    }

    const { email, otpCode } = data;

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiErrorResponse(404, "User not found");
    }

    if (user.isVerified) {
        throw new ApiErrorResponse(400, "Email already verified");
    }

    const existingUserOtp = await VerifyEmailOtp.findOne({ email });

    const isOtpCodeMatch = await verifyOtp(otpCode, existingUserOtp.otp);
    if (!isOtpCodeMatch) {
        throw new ApiErrorResponse(400, "Invalid OTP code");
    }

    user.isVerified = true;
    await user.save({ validateBeforeSave: false });

    res.status(200).json(new ApiSuccessResponse(200, "Email verified successfully"));
    await VerifyEmailOtp.deleteOne({ _id: existingUserOtp._id });

    return;
});

// resend otp
const sendEmailVerificationOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiErrorResponse(400, "Email is required");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiErrorResponse(404, "User not found");
    }

    if (user.isVerified) {
        throw new ApiErrorResponse(400, "Email already verified");
    }

    const existingUserOtp = await VerifyEmailOtp.findOne({ email });
    if (existingUserOtp) {
        await VerifyEmailOtp.deleteOne({ _id: existingUserOtp._id });
    }

    const { otp, hashedOtp } = await generateOtp();
    await VerifyEmailOtp.create({ email, otp: hashedOtp });
    await emailVerificationMail(email, otp);

    return res.status(201).json(new ApiSuccessResponse(201, "OTP sent successfully"));
});

// TODO: forgot password
// TODO: send otp by email for forgot password
// TODO: verify forgot password otp

export {
    registerUser,
    loginUserByEmail,
    logoutUser,
    refreshToken,
    verifyAccessToken,
    changePasswordByOldPassword,
    verifyEmailByOtp,
    sendEmailVerificationOtp,
};
