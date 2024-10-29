import mongoose, { Schema, model } from "mongoose";

const profileSchema = new Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        username: {
            type: String,
            required: true,
            ref: "User",
        },
        firstName: {
            type: String,
            required: true,
            minlength: 3,
            maxlength: 20,
            trim: true,
        },
        lastName: {
            type: String,
            minlength: 3,
            maxlength: 20,
            trim: true,
        },
        bio: {
            type: String,
            maxlength: 200,
            trim: true,
            default: "Hello, I'm using DarshanTube!",
        },
        profileAvatarUrl: {
            type: String,
        },
        coverImageUrl: {
            type: String,
        },
        websites: [
            {
                type: String,
            },
        ],
        socials: {
            [String]: String,
        },
        city: {
            type: String,
            maxlength: 20,
            trim: true,
        },
        birthday: {
            type: Date,
        },
        gender: {
            type: String,
            enum: ["male", "female", "other"],
        },
    },
    {
        timestamps: true,
    }
);

const Profile = model("Profile", profileSchema);

export default Profile;
