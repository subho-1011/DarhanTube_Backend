import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        theme: {
            type: String,
            enum: ["light", "dark", "system"],
        },
        emailNotifications: {
            type: Boolean,
            default: true,
        },
        notifications: {
            type: Boolean,
            default: true,
        },
        language: {
            type: String,
            enum: ["en", "es", "fr", "de", "zh"],
            default: "en",
        },
        privacy: {
            type: String,
            enum: ["public", "private"],
            default: "public",
        },
    },
    {
        timestamps: true,
    }
);

const UserSettings = mongoose.model("Settings", settingsSchema);

export default UserSettings;
