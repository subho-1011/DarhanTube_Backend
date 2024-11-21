import CommunityPost, { CommunityPostLike, CommunityPostComment } from "../models/community-post.model.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadImageOnCloudinary } from "../utils/cloudinary.js";
import { ApiErrorResponse, ApiSuccessResponse } from "../utils/handleApiResponse.js";

/**
 * ======================== Get all posts ========================
 */
export const getPosts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    const posts = await CommunityPost.aggregate([
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            name: 1,
                            username: 1,
                            avatarUrl: 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind: "$owner",
        },
        {
            $lookup: {
                from: "communitypostlikes",
                localField: "_id",
                foreignField: "post",
                as: "postLikes",
            },
        },
        {
            $addFields: {
                isLiked: {
                    $in: [req.user?._id, "$postLikes.likedBy"],
                },
            },
        },
        {
            $project: {
                postLikes: 0,
                updatedAt: 0,
                __v: 0,
            },
        },
        {
            $sort: { createdAt: -1 },
        },
        {
            $facet: {
                metadata: [{ $count: "total" }, { $addFields: { page: Number(page) } }],
                posts: [{ $skip: (page - 1) * limit }, { $limit: Number(limit) }],
            },
        },
    ]);
    console.log(posts[0].posts);

    return res.status(200).json(
        new ApiSuccessResponse(200, "Posts fetched successfully", {
            posts: posts[0].posts,
            metadata: {
                total: Math.ceil(posts[0].metadata[0]?.total / limit),
                page: posts[0].metadata[0]?.page,
            },
        })
    );
});

/**
 * ======================== Get user post ========================
 */
export const getUserPosts = asyncHandler(async (req, res) => {
    const currUserId = req.user?._id;
    const { page = 1, limit = 10 } = req.query;

    const communityPosts = await CommunityPost.aggregate([
        {
            $match: { owner: currUserId },
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
                            name: 1,
                            username: 1,
                            avatarUrl: 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind: "$owner",
        },
        {
            $lookup: {
                from: "communitypostlikes",
                localField: "_id",
                foreignField: "post",
                as: "postLikes",
            },
        },
        {
            $addFields: {
                isLiked: {
                    $in: [currUserId, "$postLikes.likedBy"],
                },
            },
        },
        {
            $project: {
                postLikes: 0,
                updatedAt: 0,
                __v: 0,
            },
        },
        {
            $sort: { createdAt: -1 },
        },
        {
            $facet: {
                metadata: [{ $count: "total" }, { $addFields: { page: Number(page) } }],
                posts: [{ $skip: (page - 1) * limit }, { $limit: Number(limit) }],
            },
        },
    ]);

    return res.status(200).json(
        new ApiSuccessResponse("Posts fetched successfully", {
            posts: communityPosts[0].posts,
            metadata: {
                total: Math.ceil(communityPosts[0].metadata[0]?.total / limit),
                page: communityPosts[0].metadata[0]?.page,
            },
        })
    );
});

/**
 * ======================== Create a post ========================
 */
export const createPost = asyncHandler(async (req, res) => {
    if (!req.user) {
        return res.status(401).json(new ApiErrorResponse(401, "You must be logged in to create a post!"));
    }

    const imagePath = req.files.image?.[0].path;
    const { content } = req.body;
    console.log(imagePath);

    if (!content) {
        return res.status(400).json(new ApiErrorResponse(400, "Write something to post!"));
    }

    const post = new CommunityPost({
        content,
        owner: req.user?._id,
    });

    if (!post) {
        return res.status(400).json(new ApiErrorResponse(400, "Post not created!"));
    }

    await post.save();
    if (!imagePath) {
        return res.status(201).json(new ApiSuccessResponse(201, "Post created successfully", { post }));
    }

    const imageResponse = await uploadImageOnCloudinary(imagePath, "community-posts");

    post.image.url = imageResponse.secure_url;
    post.image.publicId = imageResponse.public_id;
    await post.save();

    return res.status(201).json(new ApiSuccessResponse(201, "Post created successfully", { post }));
});

/**
 * ======================== Get a post ========================
 */

export const getPost = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const post = await CommunityPost.aggregate([
        {
            $match: { _id: id },
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
                            name: 1,
                            username: 1,
                            avatarUrl: 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind: "$owner",
        },
        {
            $lookup: {
                from: "communitypostlikes",
                localField: "_id",
                foreignField: "post",
                as: "postLikes",
            },
        },
        {
            $addFields: {
                isLiked: {
                    $in: [req.user?._id, "$postLikes.likedBy"],
                },
            },
        },
        {
            $lookup: {
                from: "communitypostcomments",
                localField: "_id",
                foreignField: "post",
                as: "comments",
            },
        },
        {
            $project: {
                postLikes: 0,
                updatedAt: 0,
                __v: 0,
            },
        },
    ]);

    return res.status(200).json(new ApiSuccessResponse(200, "Post fetched successfully", { post: post[0] }));
});

/**
 * ======================== Update a post ========================
 */

export const updatePost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!req.user) {
        return res.status(401).json(new ApiErrorResponse(401, "You must be logged in to update a post!"));
    }

    const post = await CommunityPost.findById(id);
    if (!post) {
        return res.status(404).json(new ApiErrorResponse(404, "Post not found!"));
    }

    if (post.owner.toString() !== req.user?._id.toString()) {
        return res.status(403).json(new ApiErrorResponse(403, "You are not authorized to update this post!"));
    }

    const { content } = req.body;
    if (!content) {
        return res.status(400).json(new ApiErrorResponse(400, "Write something to update the post!"));
    }

    post.content = content;
    post.isEdited = true;
    await post.save();

    return res.status(200).json(new ApiSuccessResponse(200, "Post updated successfully", { post }));
});

/**
 *  ======================== Delete a post ========================
 */

export const deletePost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!req.user) {
        return res.status(401).json(new ApiErrorResponse(401, "You must be logged in to delete a post!"));
    }

    const post = await CommunityPost.findById(id);
    if (!post) {
        return res.status(404).json(new ApiErrorResponse(404, "Post not found!"));
    }

    if (post.owner.toString() !== req.user?._id.toString() || req.user?.role !== "admin") {
        return res.status(403).json(new ApiErrorResponse(403, "You are not authorized to delete this post!"));
    }

    await CommunityPost.findByIdAndDelete(id);

    return res.status(200).json(new ApiSuccessResponse(200, "Post deleted successfully"));
});

/**
 * ======================== Like a post ========================
 */

export const likePost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!req.user) {
        return res.status(401).json(new ApiErrorResponse(401, "You must be logged in to like a post!"));
    }

    const post = await CommunityPost.findById(id);
    if (!post) {
        return res.status(404).json(new ApiErrorResponse(404, "Post not found!"));
    }

    const like = await CommunityPostLike.findOne({ post: id, likedBy: req.user?._id });
    if (like) {
        await CommunityPostLike.findByIdAndDelete(like._id);
        post.likes -= 1;
        await post.save();

        return res.status(200).json(new ApiSuccessResponse(200, "Post unliked successfully", { post }));
    }

    const newLike = new CommunityPostLike({
        post: id,
        likedBy: req.user?._id,
    });

    await newLike.save();

    post.likes += 1;
    await post.save();

    return res.status(200).json(new ApiSuccessResponse(200, "Post liked successfully", { post, like: newLike }));
});

/**
 * ======================== Get comments ========================
 */
export const getCommentsOfPost = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const post = await CommunityPost.findById(id);
    if (!post) {
        return res.status(404).json(new ApiErrorResponse(404, "Post not found!"));
    }

    const comments = await CommunityPostComment.aggregate([
        {
            $match: { post: post._id },
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
                            name: 1,
                            username: 1,
                            avatarUrl: 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind: "$owner",
        },
        {
            $sort: { createdAt: -1 },
        },
        {
            $facet: {
                metadata: [{ $count: "total" }, { $addFields: { page: Number(page) } }],
                comments: [{ $skip: (page - 1) * limit }, { $limit: Number(limit) }],
            },
        },
    ]);

    return res.status(200).json(
        new ApiSuccessResponse(200, "Comments fetched successfully", {
            comments: comments[0].comments,
            metadata: {
                total: Math.ceil(comments[0].metadata[0]?.total / limit),
                page: comments[0].metadata[0]?.page,
            },
        })
    );
});

/**
 * ======================== Create a comment ========================
 */
export const createComment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!req.user) {
        return res.status(401).json(new ApiErrorResponse(401, "You must be logged in to comment on a post!"));
    }

    const post = await CommunityPost.findById(id);
    if (!post) {
        return res.status(404).json(new ApiErrorResponse(404, "Post not found!"));
    }

    const { text } = req.body;
    if (!text) {
        return res.status(400).json(new ApiErrorResponse(400, "Write something to comment!"));
    }

    const comment = new CommunityPostComment({
        text,
        owner: req.user?._id,
        post: id,
    });

    await comment.save();
    post.comments += 1;
    await post.save();

    return res.status(201).json(new ApiSuccessResponse(201, "Comment created successfully", { comment }));
});

/**
 * ======================== delete a comment ========================
 */
export const deleteCommentOfPost = asyncHandler(async (req, res) => {
    const { id, commentId } = req.params;
    if (!req.user) {
        return res.status(401).json(new ApiErrorResponse(401, "You must be logged in to delete a comment!"));
    }

    const post = await CommunityPost.findById(id);
    if (!post) {
        return res.status(404).json(new ApiErrorResponse(404, "Post not found!"));
    }

    const comment = await CommunityPostComment.findOne({ _id: commentId, post: id });
    if (!comment) {
        return res.status(404).json(new ApiErrorResponse(404, "Comment not found!"));
    }

    await CommunityPostComment.findByIdAndDelete(commentId);
    post.comments -= 1;
    await post.save();

    return res.status(200).json(new ApiSuccessResponse(200, "Comment deleted successfully"));
});
