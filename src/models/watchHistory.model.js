import mongoose from "mongoose";

const watchHistorySchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        video: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video",
            required: true,
        },
        lastWatchedAt: {
            type: Date,
            required: true,
        },
        totalDuration: {
            type: Number,
            default: 0,
        },
        repeated: {
            type: Number,
            default: 0,
        },
        watchedSession: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "WatchSession",
            },
        ],
    },
    { timestamps: true }
);

watchHistorySchema.index({ owner: 1, video: 1 }, { unique: true });

const WatchHistory = mongoose.model("WatchHistory", watchHistorySchema);

export default WatchHistory;
