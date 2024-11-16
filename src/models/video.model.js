import mongoose, { Schema, model } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoDataSchema = new mongoose.Schema({
    _id: false,
    posterUrl: {
        type: String,
    },
    sources: [
        {
            src: { type: String },
            type: { type: String },
            _id: false,
        },
    ],
});

export const VIDEO_CATEGORY_ENUM = {
    ENTERTAINMENT: "Entertainment",
    NEWS: "News",
    GAMEING: "Gameing",
    MOVIES: "Movies",
    BLOGING: "Bloging",
    REVIEWS: "Reviews",
    TECHNOLOGY: "Technology",
    MUSIC: "Music",
    SERIES: "Series",
    TV_SHOWS: "TV Shows",
    ANIME: "Anime",
    ANIME_MOVIE: "Anime Movie",
    ANIME_SERIES: "Anime Series",
};

export const VIDEO_STATUS_ENUM = ["published", "unpublished", "draft"];

export const VIDEO_QUALITY_ENUM = ["240p", "360p", "480p", "720p"];

export const VIDEO_QUALITY_ENUM_VALUES = Object.values(VIDEO_QUALITY_ENUM);

const videoSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            default: "Untitled",
        },
        slug: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            lowercase: true,
            index: true,
        },
        description: {
            type: String,
            trim: true,
        },
        thumbnailUrl: {
            type: String,
            required: true,
        },
        thumbnail: {
            url: { type: String },
            publicId: { type: String },
            _id: false,
        },
        videoUrls: {
            originalVideoUrl: { type: String, required: true },
            posterUrl: { type: String },
            publicId: { type: String },
            "240p": videoDataSchema,
            "360p": videoDataSchema,
            "480p": videoDataSchema,
            "720p": videoDataSchema,
        },
        tags: [
            {
                type: String,
                ref: "Tag",
            },
        ],
        category: {
            type: String,
            enum: Object.values(VIDEO_CATEGORY_ENUM),
            required: true,
            default: "Entertainment",
        },
        views: {
            type: Number,
            default: 0,
        },
        duration: {
            type: Number,
        },
        isPublic: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            enum: Object.values(VIDEO_STATUS_ENUM),
            default: "draft",
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

videoSchema.index({ slug: 1, owner: 1 }, { unique: true });

videoSchema.plugin(mongooseAggregatePaginate);

const Video = model("Video", videoSchema);

export default Video;
