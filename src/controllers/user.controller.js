import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";

import { ApiErrorResponse, ApiReridectResponse, ApiSuccessResponse } from "../utils/handleApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteImageToCloudinary, uploadImageOnCloudinary } from "../utils/cloudinary.js";

import { EditProfileFormSchema } from "../validators/profile-validations.js";
import UserSettings from "../models/userSettings.model.js";

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiSuccessResponse(200, "Current user fetched successfully", { user: req.user }));
});

const getUserProfile = asyncHandler(async (req, res) => {
    const profile = await Profile.findOne({ owner: req.user?._id }).select("-__v");

    if (!profile) {
        throw new ApiErrorResponse(404, "Profile not found");
    }

    return res.status(200).json(new ApiSuccessResponse(200, "Profile fetched successfully", { profile }));
});

const updateProfile = asyncHandler(async (req, res) => {
    const { data, error } = EditProfileFormSchema.safeParse(req.body);
    if (error) {
        throw ApiErrorResponse.fromZodError(error);
    }

    const profile = await Profile.findOne({ owner: req.user?._id });
    if (!profile) {
        throw new ApiErrorResponse(404, "Profile not found");
    }

    profile.firstName = data.firstName || profile.firstName;
    profile.lastName = data.lastName || profile.lastName;
    profile.bio = data.bio || profile.bio;
    profile.city = data.city || profile.city;
    profile.gender = data.gender || profile.gender;

    const [day, month, year] = data.birthday && data.birthday.split("/").map(Number);
    if (day && month && year) {
        const date = new Date(Date.UTC(year, month - 1, day));
        profile.birthday = date;
    }
    if (data.websites) {
        profile.websites = data.websites;
    }
    if (data.socials) {
        profile.socials = data.socials;
    }

    await profile.save();

    return res.status(200).json(new ApiSuccessResponse(200, "Profile updated successfully", { profile }));
});

const changeProfileAvatar = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiErrorResponse(400, "Avatar is required for profile avatar update");
    }

    const avatar = await uploadImageOnCloudinary(avatarLocalPath, "avatar");

    if (!avatar) {
        throw new ApiErrorResponse(500, "Failed to upload avatar");
    }

    const profile = await Profile.findOne({ owner: _id });

    if (!profile) {
        throw new ApiErrorResponse(404, "Profile not found");
    }

    const oldAvatarUrl = profile.profileAvatarUrl;
    profile.profileAvatarUrl = avatar.url;

    await profile.save();
    await User.findByIdAndUpdate(_id, { avatarUrl: avatar.url });

    if (oldAvatarUrl) {
        await deleteImageToCloudinary(oldAvatarUrl);
    }

    return res.status(200).json(new ApiSuccessResponse(200, "Profile updated successfully", { profile }));
});

const changeProfileCoverImage = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiErrorResponse(400, "Cover image is required for profile cover image update");
    }

    const coverImage = await uploadImageOnCloudinary(coverImageLocalPath, "coverImage");

    if (!coverImage) {
        throw new ApiErrorResponse(500, "Failed to upload cover image");
    }

    const profile = await Profile.findOne({ owner: _id });

    if (!profile) {
        throw new ApiErrorResponse(404, "Profile not found");
    }

    const oldCoverImageUrl = profile.coverImageUrl;
    profile.coverImageUrl = coverImage.url;

    await profile.save();
    await User.findByIdAndUpdate(_id, { coverImageUrl: coverImage.url });

    if (oldCoverImageUrl) {
        await deleteImageToCloudinary(oldCoverImageUrl);
    }

    return res.status(200).json(new ApiSuccessResponse(200, "Profile updated successfully", { profile }));
});

const getUserSettings = asyncHandler(async (req, res) => {
    const settings = await UserSettings.findOne({ owner: req.user?._id }).select("-__v -owner -createdAt -updatedAt");
    if (!settings) {
        throw new ApiErrorResponse(404, "Settings not found");
    }

    return res.status(200).json(new ApiSuccessResponse(200, "Settings fetched successfully", { settings }));
});

const updateUserSettings = asyncHandler(async (req, res) => {
    const { theme, emailNotifications, notifications, language, privacy } = req.body;

    const settings = await UserSettings.findOne({ owner: req.user?._id });
    if (!settings) {
        throw new ApiErrorResponse(404, "Settings not found");
    }

    settings.theme = theme ?? settings.theme;
    settings.emailNotifications = emailNotifications ?? settings.emailNotifications;
    settings.notifications = notifications ?? settings.notifications;
    settings.language = language ?? settings.language;
    settings.privacy = privacy ?? settings.privacy;

    await settings.save();

    return res.status(200).json(new ApiSuccessResponse(200, "Settings updated successfully", { settings }));
});

const deleteCurrentUser = asyncHandler(async (req, res) => {
    const { _id } = req.user;

    const { username, password } = req.body;
    if (!username || !password) {
        throw new ApiErrorResponse(400, "Username and password are required");
    }

    const checkUsername = username === req.user.username;
    if (!checkUsername) {
        throw new ApiErrorResponse(400, "Username is incorrect");
    }

    const checkPassword = await req.user.isPasswordMatch(password);
    if (!checkPassword) {
        throw new ApiErrorResponse(400, "Password is incorrect");
    }

    await User.findByIdAndDelete(_id);
    await Profile.findOneAndDelete({ owner: _id });
    await UserSettings.findOneAndDelete({ owner: _id });
    await deleteImageToCloudinary(req.user.avatarUrl);
    await deleteImageToCloudinary(req.user.coverImageUrl);

    return res
        .clearCookie("accessToken")
        .clearCookie("refreshToken")
        .status(200)
        .json(new ApiReridectResponse(200, "User deleted successfully", "/"));
});

export {
    getCurrentUser,
    getUserProfile,
    updateProfile,
    changeProfileAvatar,
    changeProfileCoverImage,
    getUserSettings,
    updateUserSettings,
    deleteCurrentUser,
};
