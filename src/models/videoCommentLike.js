import mongoose from "mongoose";

const videoCommentLikeSchema = new mongoose.Schema(
    {
        comment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "VideoComment",
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

const VideoCommentLike = mongoose.model("VideoCommentLike", videoCommentLikeSchema);

export default VideoCommentLike;
