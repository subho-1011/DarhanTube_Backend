import mongoose from "mongoose";

const videoLikeSchema = new mongoose.Schema(
    {
        likedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        video: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video",
            required: true,
        },
    },
    { timestamps: true }
);

videoLikeSchema.index({ likedBy: 1, video: 1 }, { unique: true });

const VideoLike = mongoose.model("VideoLike", videoLikeSchema);

export default VideoLike;
