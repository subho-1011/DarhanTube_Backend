import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const communityPostSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: true,
            max: 280,
        },
        image: {
            url: { type: String },
            publicId: { type: String },
            _id: false,
        },
        isEdited: {
            type: Boolean,
            default: false,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        likes: {
            type: Number,
            default: 0,
        },
        comments: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

const CommunityPost = mongoose.model("CommunityPost", communityPostSchema);

communityPostSchema.plugin(mongooseAggregatePaginate);

export default CommunityPost;

/**
 * ======================== The community post like ========================
 */
const communityPostLikeSchema = new mongoose.Schema(
    {
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CommunityPost",
            required: true,
        },
        likedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

const CommunityPostLike = mongoose.model("CommunityPostLike", communityPostLikeSchema);

/**
 * ======================== The community post comment ========================
 */

const communityPostCommentSchema = new mongoose.Schema(
    {
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CommunityPost",
            required: true,
        },
        text: {
            type: String,
            required: true,
            max: 280,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

const CommunityPostComment = mongoose.model("CommunityPostComment", communityPostCommentSchema);

export { CommunityPostLike, CommunityPostComment };
