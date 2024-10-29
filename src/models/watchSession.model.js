import mongoose from "mongoose";

const watchSessionSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        device: {
            type: String,
            enum: ["Desktop", "Mobile", "Tablet"],
            default: "Desktop",
        },
        platform: {
            type: String,
            enum: ["Windows", "MacOS", "Linux"],
            default: "Windows",
        },
        totalDuration: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

const WatchSession = mongoose.model("WatchSession", watchSessionSchema);

export default WatchSession;
