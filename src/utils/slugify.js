import Video from "../models/video.model.js";
import Playlist from "../models/playlist.model.js";

export const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-") // Replace spaces with -
        .replace(/[^\w\-]+/g, "") // Remove all non-word chars
        .replace(/\-\-+/g, "-"); // Replace multiple - with single -
};

export const genarateUniqueVideoSlug = async function (title) {
    let slug = slugify(title);

    // Generate a unique slug
    while (true) {
        const existingVideo = await Video.findOne({ slug });
        if (!existingVideo) {
            break;
        }
        slug = `${slug}-${Math.floor(Math.random() * 1000) + 1}`;
    }

    return slug;
};

export const genarateUniquePlaylistSlug = async function (title) {
    let slug = slugify(title);

    // Generate a unique slug
    while (true) {
        const existingPlaylist = await Playlist.findOne({
            slug,
        });
        if (!existingPlaylist) {
            break;
        }
        slug = `${slug}-${Math.floor(Math.random() * 1000) + 1}`;
    }
    return slug;
};
