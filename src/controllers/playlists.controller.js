import Video from "../models/video.model.js";
import Playlist from "../models/playlist.model.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { genarateUniquePlaylistSlug } from "../utils/slugify.js";
import { ApiSuccessResponse, ApiErrorResponse } from "../utils/handleApiResponse.js";

export const getPlaylists = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    const playlists = await Playlist.aggregate([
        {
            $match: { isPublic: true },
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                        },
                    },
                    {
                        $unwind: "$owner",
                    },
                    {
                        $project: {
                            title: 1,
                            description: 1,
                            posterUrl: 1,
                            owner: {
                                _id: 1,
                                username: 1,
                            },
                        },
                    },
                ],
            },
        },
        {
            $sort: { createdAt: -1 },
        },
        {
            $skip: (parseInt(page) - 1) * parseInt(limit),
        },
        {
            $limit: parseInt(limit),
        },
    ]);

    if (!playlists || playlists.length === 0) {
        return res
            .status(404)
            .json(new ApiErrorResponse(404, page === 1 ? "No playlists found" : "No more playlists found"));
    }

    return res.status(200).json(
        new ApiSuccessResponse(200, "Playlists fetched successfully", {
            playlists: playlists || [],
        })
    );
});

export const createPlaylist = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    if (!title) {
        return res.status(400).json(new ApiErrorResponse(400, "Title is required to create a playlist"));
    }

    const slug = await genarateUniquePlaylistSlug(title);
    const playlist = await Playlist.create({
        title,
        slug,
        description,
        owner: req.user?._id,
    });

    return res.status(201).json(new ApiSuccessResponse(201, "Playlist created successfully", { playlist }));
});

export const getPlaylistById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json(new ApiErrorResponse(400, "Playlist ID is required"));
    }

    const playlist = await Playlist.findOne({
        _id: id,
        $or: [{ isPublic: true }, { owner: req.user._id }],
    }).populate({
        path: "videos",
        select: "title description posterUrl",
    });

    if (!playlist) {
        return res.status(404).json(new ApiErrorResponse(404, "Playlist not found"));
    }

    return res.status(200).json(new ApiSuccessResponse(200, "Playlist fetched successfully", { playlist }));
});

export const updatePlaylistById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json(new ApiErrorResponse(400, "Playlist ID is required"));
    }

    const playlist = await Playlist.findOne({
        _id: id,
        owner: req.user._id,
    });

    if (!playlist) {
        return res.status(404).json(new ApiErrorResponse(404, "Playlist not found"));
    }

    const { title, description } = req.body;
    if (title) {
        playlist.title = title;
    }
    if (description) {
        playlist.description = description;
    }

    await playlist.save();

    return res.status(200).json(new ApiSuccessResponse(200, "Playlist updated successfully", { playlist }));
});

export const deletePlaylistById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json(new ApiErrorResponse(400, "Playlist ID is required"));
    }

    const playlist = await Playlist.findOne({
        _id: id,
        owner: req.user._id,
    });

    if (!playlist) {
        return res.status(404).json(new ApiErrorResponse(404, "Playlist not found"));
    }

    await Playlist.findByIdAndDelete(playlist._id);

    return res.status(200).json(new ApiSuccessResponse(200, "Playlist deleted successfully"));
});

export const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { id, videoSlug } = req.params;
    if (!id) {
        return res.status(400).json(new ApiErrorResponse(400, "Playlist ID is required"));
    }

    if (!videoSlug) {
        return res.status(400).json(new ApiErrorResponse(400, "Video ID is required to add to playlist"));
    }

    const video = await Video.findOne({ slug: videoSlug });
    if (!video) {
        return res.status(404).json(new ApiErrorResponse(404, "Video not found to add to playlist"));
    }

    const playlist = await Playlist.findOne({
        _id: id,
        owner: req.user._id,
    });

    if (!playlist) {
        return res.status(404).json(new ApiErrorResponse(404, "Playlist not found to add video"));
    }

    playlist.videos = playlist.videos.filter((v) => v.toString() !== video._id.toString());
    playlist.posterUrl = video?.thumbnail.url || video?.thumbnailUrl || playlist.posterUrl;
    playlist.videos.push(video._id);
    await playlist.save();

    return res.status(200).json(new ApiSuccessResponse(200, "Video added to playlist successfully", { playlist }));
});

export const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { id, videoId } = req.params;
    if (!id || !videoId) {
        const errMsg = id
            ? "Video ID is required to remove from playlist"
            : "Playlist ID is required to remove video from playlist";

        return res.status(400).json(new ApiErrorResponse(400, errMsg));
    }

    const playlist = await Playlist.findOne({
        _id: id,
        owner: req.user._id,
    });

    if (!playlist) {
        return res.status(404).json(new ApiErrorResponse(404, "Playlist not found"));
    }

    playlist.videos = playlist.videos.filter((v) => v.toString() !== videoId);
    await playlist.save();

    return res.status(200).json(new ApiSuccessResponse(200, "Video removed from playlist successfully"));
});

export const togglePublic = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json(new ApiErrorResponse(400, "Playlist ID is required"));
    }

    const playlist = await Playlist.findOne({
        _id: id,
        owner: req.user._id,
    });

    if (!playlist) {
        return res.status(404).json(new ApiErrorResponse(404, "Playlist not found"));
    }

    playlist.isPublic = !playlist.isPublic;
    await playlist.save();

    return res.status(200).json(
        new ApiSuccessResponse(200, `Playlist is now ${playlist.isPublic ? "Public" : "Private"}`, {
            playlist,
        })
    );
});

export const getPlaylistsByUser = asyncHandler(async (req, res) => {
    const userId = req.params.id === "me" || req.params.id === "@me" ? req.user._id : req.params.id;

    const { page = 1, limit = 10 } = req.query;
    const playlists = await Playlist.aggregate([
        {
            $match: { owner: userId },
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                        },
                    },
                    {
                        $unwind: "$owner",
                    },
                    {
                        $project: {
                            title: 1,
                            slug: 1,
                            description: 1,
                            thumbnail: 1,
                            owner: {
                                _id: 1,
                                username: 1,
                                avatarUrl: 1,
                            },
                        },
                    },
                ],
            },
        },
        {
            $sort: { createdAt: -1 },
        },
        {
            $skip: (parseInt(page) - 1) * parseInt(limit),
        },
        {
            $limit: parseInt(limit),
        },
    ]);

    if (!playlists || playlists.length === 0) {
        return res.status(200).json(
            new ApiSuccessResponse(200, page === 1 ? "No playlists found" : "No more playlists found", {
                playlists: [],
            })
        );
    }

    return res.status(200).json(
        new ApiSuccessResponse(200, "Playlists fetched successfully", {
            playlists: playlists || [],
        })
    );
});

export const getPlaylistBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    if (!slug) {
        return res.status(400).json(new ApiErrorResponse(400, "Playlist slug is required"));
    }

    const playlist = await Playlist.findOne({
        slug,
        $or: [{ isPublic: true }, { owner: req.user._id }],
    }).populate({
        path: "videos",
        select: "title description posterUrl",
    });

    if (!playlist) {
        return res.status(404).json(new ApiErrorResponse(404, "Playlist not found"));
    }

    return res.status(200).json(new ApiSuccessResponse(200, "Playlist fetched successfully", { playlist }));
});

export const searchPlaylists = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    console.log(userId);
    if (!userId) {
        return res.status(401).json(new ApiErrorResponse(401, "You must be logged in to search playlists"));
    }

    const query = req.query.q;
    if (!query) {
        return res.status(400).json(new ApiErrorResponse(400, "Search query is required"));
    }

    const playlists = await Playlist.aggregate([
        {
            $match: {
                title: { $regex: query, $options: "i" },
                owner: userId,
            },
        },
    ]);

    return res.status(200).json(
        new ApiSuccessResponse(200, "Playlists fetched successfully", {
            playlists: playlists || [],
        })
    );
});
