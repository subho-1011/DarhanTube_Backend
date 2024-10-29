import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoCommentSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: true,
        },
        video: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video",
            required: true,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        replies: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "VideoComment",
            },
        ],
        parentComment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "VideoComment",
        },
    },
    { timestamps: true }
);

videoCommentSchema.plugin(mongooseAggregatePaginate);

const VideoComment = mongoose.model("VideoComment", videoCommentSchema);

export default VideoComment;
