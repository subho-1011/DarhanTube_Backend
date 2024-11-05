import User from "../models/user.model.js";
import Video from "../models/video.model.js";
import Tag from "../models/videoTag.model.js";

import fs from "fs";

import * as cloudinary from "../utils/cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { genarateUniqueVideoSlug } from "../utils/slugify.js";
import { ApiErrorResponse, ApiSuccessResponse } from "../utils/handleApiResponse.js";

// upload video
const uploadVideo = asyncHandler(async (req, res) => {
    // get video from the request
    const videoPath = req.files.video[0]?.path;

    if (!videoPath) {
        throw new ApiErrorResponse(400, "Video not found");
    }

    const videoUrls = await cloudinary.uploadVideoOnCloudinary(videoPath, "videos");
    if (!videoUrls || !videoUrls.originalVideoUrl || !videoUrls.duration) {
        throw new ApiErrorResponse(400, "Failed to upload video");
    }

    // save as draft
    const video = new Video({
        videoUrls: { originalVideoUrl: videoUrls.originalVideoUrl },
        duration: videoUrls.duration,
        owner: req.user._id,
        status: "draft",
    });

    // add draft data to video
    video.title = `${req.user?.username}-draft-${Date.now()}`;
    video.slug = video.title;
    video.thumbnailUrl = videoUrls.videoDatas["720p"].posterUrl;

    // save
    await video.save();

    return res.status(200).json(new ApiSuccessResponse(200, "Video uploaded as draft successfully", { video }));
});

// get video by id
const getVideoById = asyncHandler(async (req, res) => {
    const video = await Video.findById(req.params?.videoId);
    if (!video) {
        throw new ApiErrorResponse(404, "Video not found");
    }

    return res.status(200).json(new ApiSuccessResponse(200, "Video data fetched successfully", { video }));
});

// get user draft videos
const getUserDraftVideos = asyncHandler(async (req, res) => {
    const video = await Video.findOne({ owner: req.user?._id, status: "draft" });

    return res.status(200).json(new ApiSuccessResponse(200, "User draft videos fetched successfully", { video }));
});

// get all videos
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 12 } = req.query;

    const videos = await Video.aggregate([
        {
            $match: {
                status: "published",
                isPublic: true,
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            username: 1,
                            avatarUrl: 1,
                        },
                    },
                ],
            },
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
        {
            $skip: (parseInt(page) - 1) * parseInt(limit),
        },
        {
            $limit: parseInt(limit),
        },
    ]);

    if (!videos) {
        return res.status(200).json(new ApiSuccessResponse(200, "No videos found", { videos: [] }));
    }

    const totalVideos = await Video.countDocuments({
        status: "published",
        isPublic: true,
    });

    return res
        .status(200)
        .json(new ApiSuccessResponse(200, "All videos fetched successfully", { videos, totalVideos }));
});

// publish video
const publishVideo = asyncHandler(async (req, res) => {
    const video = await Video.findById(req.params?.videoId);
    if (!video) {
        throw new ApiErrorResponse(404, "Video not found");
    }

    const { title, description, tags, category, isPublished } = req.body;

    video.title = title;
    video.slug = await genarateUniqueVideoSlug(title);
    video.description = description;
    video.category = category;

    video.tags = await Promise.all(
        tags.map(async (tag) => {
            const tagExists = await Tag.findOne({ name: tag });
            if (!tagExists) {
                const newTag = await Tag.create({ name: tag });
                return newTag.name;
            }
            return tagExists.name;
        })
    );

    isPublished ? (video.isPublic = true) : (video.isPublic = false);
    video.status = "published";
    await video.save();

    return res.status(200).json(new ApiSuccessResponse(200, "Video published successfully", { video }));
});

// update video
const updateMetaDataOfVideo = asyncHandler(async (req, res) => {
    const video = await Video.findById(req.params?.videoId);
    if (!video) {
        throw new ApiErrorResponse(404, "Video not found");
    }

    const { title, description, tags } = req.body;

    video.title = title;
    video.slug = await genarateUniqueVideoSlug(title);
    video.description = description;

    video.tags = await Promise.all(
        tags.map(async (tag) => {
            const tagExists = await Tag.findOne({ name: tag });
            if (!tagExists) {
                const newTag = await Tag.create({ name: tag });
                return newTag.name;
            }
            return tagExists.name;
        })
    );

    await video.save();

    return res.status(200).json(new ApiSuccessResponse(200, "Video updated successfully", { video }));
});

// upload or update thumbnail
const uploadOrUpdateThumbnail = asyncHandler(async (req, res) => {
    const video = await Video.findById(req.params?.videoId);
    if (!video) {
        throw ApiErrorResponse(404, "Video not found");
    }

    const thumbnailLocalPath = req.file?.path;
    if (!thumbnailLocalPath) {
        throw ApiErrorResponse(400, "Thumbnail path not found");
    }

    const thumbnail = await cloudinary.uploadImageOnCloudinary(thumbnailLocalPath, "thumbnails");
    if (!thumbnail) {
        throw ApiErrorResponse(500, "Error uploading thumbnail");
    }

    const oldThumbnail = video.thumbnailUrl;
    video.thumbnailUrl = thumbnail.secure_url;
    await video.save();

    if (oldThumbnail) {
        await cloudinary.deleteImageToCloudinary(oldThumbnail);
    }

    return res.status(200).json(new ApiSuccessResponse(200, "Thumbnail updated successfully", { video }));
});

// delete video
const deleteVideo = asyncHandler(async (req, res) => {
    const video = await Video.findById(req.params?.videoId);
    if (!video) {
        throw ApiErrorResponse(404, "Video not found");
    }

    const thumbnail = video.thumbnailUrl;
    const videoUrl = video.videoUrl;

    await Video.deleteOne({ _id: video._id });

    if (thumbnail) {
        await cloudinary.deleteImageToCloudinary(thumbnail);
    }

    if (videoUrl) {
        await cloudinary.deleteVideoToCloudinary(videoUrl);
    }

    return res.status(200).json(new ApiSuccessResponse(200, "Video deleted successfully", { video }));
});

// toggle public or private status of the video
const toggleVisibility = asyncHandler(async (req, res) => {
    const video = await Video.findById(req.params?.videoId);
    if (!video) {
        throw ApiErrorResponse(404, "Video not found");
    }

    video.isPublic = !video.isPublic;
    await video.save();

    return res.status(200).json(new ApiSuccessResponse(200, "Video visibility toggled successfully", { video }));
});

// get video by slug
const getVideoBySlug = asyncHandler(async (req, res) => {
    const video = await Video.findOne({ slug: req.params?.slug }).populate({
        path: "owner",
        select: "_id name username avatarUrl",
    });

    if (!video) {
        throw ApiErrorResponse(404, "Video not found");
    }

    return res.status(200).json(new ApiSuccessResponse(200, "Video found successfully", { video }));
});

// get user videos
const getUserVideos = asyncHandler(async (req, res) => {
    const username = req.params?.username;
    if (!username) {
        throw ApiErrorResponse(400, "Username is required");
    }

    let userId = null;
    if (username === "me" || username === "@me" || username === req.user?.username) {
        userId = req.user?._id;
    } else {
        const user = await User.findOne({ username });
        if (!user) {
            throw ApiErrorResponse(404, "User not found");
        }
        userId = user._id;
    }

    const { page = 1, limit = 12 } = req.query;
    const videos = await Video.find({ owner: userId })
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit))
        .populate({
            path: "owner",
            select: "_id name username avatarUrl",
        });

    if (!videos) {
        return res.status(200).json(new ApiSuccessResponse(200, "No videos found", { videos: [], totalVideos: 0 }));
    }

    const totalVideos = await Video.countDocuments({ owner: userId });

    return res.status(200).json(new ApiSuccessResponse(200, "User videos found successfully", { videos, totalVideos }));
});

export {
    getAllVideos,
    getUserDraftVideos,
    getVideoBySlug,
    uploadVideo,
    publishVideo,
    getVideoById,
    updateMetaDataOfVideo,
    uploadOrUpdateThumbnail,
    deleteVideo,
    toggleVisibility,
    getUserVideos,
};
