import mongoose from "mongoose";
import User from "../models/user.model.js";
import Video from "../models/video.model.js";
import Tag from "../models/videoTag.model.js";
import VideoLike from "../models/videoLike.model.js";
import VideoComment from "../models/videoComment.model.js";
import VideoCommentLike from "../models/videoCommentLike.js";

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
            $addFields: {
                owner: { $first: "$owner" },
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

// public routes
// get video by slug
const getVideoBySlug = asyncHandler(async (req, res) => {
    const videos = await Video.aggregate([
        {
            $match: {
                slug: req.params?.slug,
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
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "subscribedToId",
                            as: "subscribers",
                        },
                    },
                    {
                        $addFields: {
                            subscribers: { $size: "$subscribers" },
                            isSubscribed: {
                                $in: [req.user?._id, "$subscribers.subscriberId"],
                            },
                        },
                    },
                ],
            },
        },
        {
            $set: {
                owner: { $first: "$owner" },
            },
        },
        {
            $lookup: {
                from: "videolikes",
                localField: "_id",
                foreignField: "video",
                as: "likes",
            },
        },
        {
            $addFields: {
                likes: { $size: "$likes" },
                isLiked: {
                    $in: [req.user?._id, "$likes.likedBy"],
                },
                isOwner: {
                    $eq: ["$owner._id", req.user?._id],
                },
            },
        },
        {
            $project: {
                __v: 0,
            },
        },
    ]);

    if (!videos || videos.length === 0) {
        throw ApiErrorResponse(404, "Video not found");
    }

    return res.status(200).json(
        new ApiSuccessResponse(200, "Video found successfully", {
            video: videos[0],
        })
    );
});

// toggle like on video
const toggleLikeOnVideo = asyncHandler(async (req, res) => {
    const video = await Video.findById(req.params?.videoId);
    if (!video) {
        throw ApiErrorResponse(404, "Video not found");
    }

    const like = await VideoLike.findOne({ video: video._id, likedBy: req.user._id });
    if (like) {
        await VideoLike.deleteOne({ _id: like._id });
    } else {
        const newLike = new VideoLike({
            video: video._id,
            likedBy: req.user._id,
        });
        await newLike.save();
    }

    return res
        .status(200)
        .json(new ApiSuccessResponse(200, like ? "Video liked remove successfully" : "Video liked successfully"));
});

const getCommentsOfVideo = asyncHandler(async (req, res) => {
    const { page = 1, limit = 7 } = req.query;

    const videoComments = await VideoComment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(req.params?.videoId),
                parentComment: { $exists: false },
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
            $addFields: {
                owner: { $first: "$owner" },
            },
        },
        {
            $lookup: {
                from: "videocomments",
                localField: "_id",
                foreignField: "parentComment",
                as: "replies",
            },
        },
        {
            $lookup: {
                from: "videocommentlikes",
                localField: "_id",
                foreignField: "comment",
                as: "likes",
            },
        },
        {
            $addFields: {
                likes: { $size: "$likes" },
                isLiked: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$likes.likedBy"],
                        },
                        then: true,
                        else: false,
                    },
                },
                isOwner: {
                    $cond: {
                        if: {
                            $eq: ["$owner._id", req.user?._id],
                        },
                        then: true,
                        else: false,
                    },
                },
                noOfReplies: { $size: "$replies" },
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
        {
            $project: {
                __v: 0,
            },
        },
    ]);

    if (!videoComments) {
        return res.status(200).json(new ApiSuccessResponse(200, "No comments found", { comments: [] }));
    }

    const totalComments = await VideoComment.countDocuments({
        video: req.params?.videoId,
        parentComment: { $exists: false },
    });

    return res.status(200).json(
        new ApiSuccessResponse(200, "Video comments fetched successfully", {
            comments: videoComments,
            totalComments,
        })
    );
});

// post comment on video
const postCommentOnVideo = asyncHandler(async (req, res) => {
    const video = await Video.findById(req.params?.videoId);
    if (!video) {
        throw ApiErrorResponse(404, "Video not found");
    }

    const { text } = req.body;

    const comment = new VideoComment({
        text,
        video: video._id,
        owner: req.user._id,
    });

    await comment.save();

    const newComment = await VideoComment.findById(comment._id).populate({
        path: "owner",
        select: "_id name username avatarUrl",
    });

    return res.status(200).json(new ApiSuccessResponse(200, "Comment posted successfully", { comment: newComment }));
});

const updateCommentOfVideo = asyncHandler(async (req, res) => {
    const comment = await VideoComment.findById(req.params?.commentId);
    if (!comment) {
        throw ApiErrorResponse(404, "Comment not found");
    }

    const { text } = req.body;

    comment.text = text;
    comment.isEdited = true;
    await comment.save();

    return res.status(200).json(new ApiSuccessResponse(200, "Comment updated successfully", { comment }));
});

const deleteCommentOfVideo = asyncHandler(async (req, res) => {
    const comment = await VideoComment.findById(req.params?.commentId);
    if (!comment) {
        throw ApiErrorResponse(404, "Comment not found");
    }

    await VideoComment.deleteOne({ _id: comment._id });

    return res.status(200).json(new ApiSuccessResponse(200, "Comment deleted successfully", { comment }));
});

const toggleLikeOnCommentOfVideo = asyncHandler(async (req, res) => {
    const comment = await VideoComment.findById(req.params?.commentId);
    if (!comment) {
        throw ApiErrorResponse(404, "Comment not found");
    }

    const like = await VideoCommentLike.findOne({ comment: comment._id, likedBy: req.user._id });
    if (like) {
        await VideoCommentLike.deleteOne({ _id: like._id });
    } else {
        const newLike = new VideoCommentLike({
            comment: comment._id,
            likedBy: req.user._id,
        });
        await newLike.save();
    }

    return res
        .status(200)
        .json(new ApiSuccessResponse(200, like ? "Comment liked remove successfully" : "Comment liked successfully"));
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
    // public routes
    toggleLikeOnVideo,
    getCommentsOfVideo,
    postCommentOnVideo,
    updateCommentOfVideo,
    deleteCommentOfVideo,
    toggleLikeOnCommentOfVideo,
};
