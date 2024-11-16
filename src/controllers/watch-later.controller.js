import WatchLater from "../models/watch-later.model.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrorResponse, ApiSuccessResponse } from "../utils/handleApiResponse.js";

const getWatchLaterVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    const watchLaterVideos = await WatchLater.aggregate([
        {
            $match: { owner: req.user._id },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
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
                    { $unwind: "$owner" },
                    {
                        $project: {
                            __v: 0,
                            isPublic: 0,
                            status: 0,
                            updatedAt: 0,
                        },
                    },
                ],
            },
        },
        {
            $unwind: "$video",
        },
        {
            $sort: { addedAt: -1 },
        },
        {
            $skip: (page - 1) * limit,
        },
        {
            $limit: limit,
        },
    ]);

    return res.status(200).json(
        new ApiSuccessResponse(200, "Watch later videos fetched successfully", {
            videos: watchLaterVideos.map((item) => item.video),
        })
    );
});

const addVideoToWatchLater = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const videoExists = await WatchLater.findOne({ owner: req.user._id, video: videoId });
    if (videoExists) {
        throw new ApiErrorResponse(400, "Video already exists in watch later");
    }

    const watchLaterVideo = await WatchLater.create({
        owner: req.user._id,
        video: videoId,
    });

    return res
        .status(201)
        .json(new ApiSuccessResponse(201, "Video added to watch later successfully", { watchLaterVideo }));
});

const removeVideoFromWatchLater = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const watchLaterVideo = await WatchLater.findOneAndDelete({ owner: req.user._id, video: videoId });

    if (!watchLaterVideo) {
        throw new ApiErrorResponse(404, "Video not found in watch later");
    }

    return res
        .status(200)
        .json(new ApiSuccessResponse(200, "Video removed from watch later successfully", { watchLaterVideo }));
});

export { getWatchLaterVideos, addVideoToWatchLater, removeVideoFromWatchLater };
