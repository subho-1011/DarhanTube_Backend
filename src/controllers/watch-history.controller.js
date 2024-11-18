import Video from "../models/video.model.js";
import WatchHistory from "../models/watchHistory.model.js";
import WatchSession from "../models/watchSession.model.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrorResponse, ApiSuccessResponse } from "../utils/handleApiResponse.js";

export const getWatchHistory = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    const watchHistory = await WatchHistory.aggregate([
        {
            $match: {
                owner: req.user?._id,
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
            },
        },
        {
            $unwind: "$video",
        },
        {
            $lookup: {
                from: "users",
                localField: "video.owner",
                foreignField: "_id",
                as: "video.owner",
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
            $unwind: "$video.owner",
        },
        {
            $sort: {
                lastWatchedAt: -1,
            },
        },
        {
            $skip: (parseInt(page) - 1) * parseInt(limit),
        },
        {
            $limit: parseInt(limit),
        },
    ]);

    if (!watchHistory || watchHistory.length === 0) {
        return res.status(200).json(new ApiSuccessResponse(200, "Watch history", { watchHistorys: [] }));
    }

    // Get total watch history count
    const totalWatchHistory = await WatchHistory.countDocuments({
        owner: req.user?._id,
    });

    return res
        .status(200)
        .json(new ApiSuccessResponse(200, "Watch history", { watchHistorys: watchHistory, totalWatchHistory }));
});

// Create watch history
export const createWatchHistory = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { watchedDuration = 0, timestamp = 0 } = req.body;

    const video = await Video.findById(videoId);
    if (!video) {
        return res.status(404).json(new ApiErrorResponse(404, "Video not found"));
    }

    video.views += 1;
    await video.save();

    const watchHistory = await WatchHistory.findOne({
        owner: req.user?._id,
        video: videoId,
    });

    await WatchSession.findOneAndDelete({ owner: req.user?._id, video: videoId });

    if (watchHistory) {
        watchHistory.lastWatchedAt = new Date();
        await watchHistory.save();
        return res.status(200).json(new ApiSuccessResponse(200, "Watch history already exists"));
    }

    await WatchHistory.create({
        owner: req.user?._id,
        video: videoId,
        totalDuration: watchedDuration,
        repeated: 0,
        lastWatchedAt: new Date(),
    });

    await WatchSession.create({
        owner: req.user?._id,
        video: videoId,
        totalDuration: watchedDuration,
        timestamp,
    });

    return res.status(201).json(new ApiSuccessResponse(201, "Watch history: new watch history created"));
});

// Update watch history
export const updateWatchHistory = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { watchedDuration = 0, timestamp = 0 } = req.body;
    console.log(watchedDuration, timestamp);

    const video = await Video.findById(videoId);
    if (!video) {
        return res.status(404).json(new ApiErrorResponse(404, "Video not found"));
    }

    const watchHistory = await WatchHistory.findOne({
        owner: req.user?._id,
        video: videoId,
    });

    if (!watchHistory) {
        return res.status(404).json(new ApiErrorResponse(404, "Watch history not found"));
    }

    const watchSession = await WatchSession.findOne({
        owner: req.user?._id,
        video: videoId,
    });
    console.log(watchSession);

    // If the watch session completed or timestamp 95% of viedo duration, delete it and create a new one
    if (watchSession && watchSession.timestamp >= video.duration * 0.95) {
        await WatchSession.findOneAndDelete({ owner: req.user?._id, video: videoId });

        const watchSession = new WatchSession({
            owner: req.user?._id,
            video: videoId,
            totalDuration: watchedDuration,
            timestamp,
        });
        await watchSession.save();

        watchHistory.repeated += 1;
        watchHistory.lastWatchedAt = new Date();
        watchHistory.totalDuration += watchedDuration;
        watchHistory.watchedSession = watchSession._id;
        await watchHistory.save();

        return res.status(200).json(new ApiSuccessResponse(200, "Watch history updated"));
    }

    if (!watchSession) {
        watchSession = new WatchSession({
            owner: req.user?._id,
            video: videoId,
            totalDuration: watchedDuration,
            timestamp,
        });

        await watchSession.save();

        watchHistory.lastWatchedAt = new Date();
        watchHistory.totalDuration += watchedDuration;
        watchHistory.watchedSession = watchSession._id;
        await watchHistory.save();

        return res.status(200).json(new ApiSuccessResponse(200, "Watch history updated"));
    }

    watchSession.totalDuration += watchedDuration;
    watchSession.timestamp = timestamp;
    await watchSession.save();

    watchHistory.lastWatchedAt = new Date();
    watchHistory.totalDuration += watchedDuration;
    watchHistory.watchedSession = watchSession._id;
    await watchHistory.save();

    return res.status(200).json(new ApiSuccessResponse(200, "Watch history updated"));
});

export const deleteWatchHistory = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const watchHistory = await WatchHistory.findOneAndDelete({
        owner: req.user?._id,
        video: videoId,
    });

    if (!watchHistory) {
        return res.status(404).json(new ApiErrorResponse(404, "Watch history not found"));
    }

    await WatchSession.findOneAndDelete({
        _id: watchHistory.watchedSession,
    });

    return res.status(200).json(new ApiSuccessResponse(200, "Watch history deleted"));
});
