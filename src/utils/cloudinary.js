import fs from "fs";
import { VIDEO_QUALITY_ENUM_VALUES, VIDEO_QUALITY_ENUM } from "../models/video.model.js";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const ROOT_FOLDER = "darshanTube";

export const cloudinaryVideoHtmlExtract = (html) => {
    const posterRegex = /poster='([^']+)'/;
    const posterMatch = html.match(posterRegex);
    const poster = posterMatch ? posterMatch[1] : null;

    const sourceRegex = /<source src='([^']+)' type='([^']+)'/g;
    const sources = [];
    let sourceMatch;

    while ((sourceMatch = sourceRegex.exec(html)) !== null) {
        const src = sourceMatch[1];
        const type = sourceMatch[2];
        sources.push({ src, type });
    }

    const data = { posterUrl: poster, sources };

    return data;
};

/**
 * Uploads a local image to cloudinary and returns the response
 * @param {string} localFilePath - The path of the local image
 * @param {string} folder - The folder to upload image to
//  * @returns {Promise<{res :UploadApiResponse}>} The response from cloudinary
 */
const uploadImageOnCloudinary = async (localFilePath, folder) => {
    try {
        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            folder: `${ROOT_FOLDER}/${folder}`,
            resource_type: "image",
        });

        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        console.error("Error uploading image to cloudinary:", error);
        fs.unlinkSync(localFilePath);
        return null;
    }
};

/**
 * Uploads a local video to cloudinary, extracts the poster image and sources from the generated html,
 * and returns the cloudinary response, poster image, sources, and duration of the video.
 * @param {string} localFilePath - The path of the local video
 * @param {string} folder - The folder to upload video to
 * @returns {Promise<{originalVideoUrl: string, videoDatas: object, duration: number}>} The response from cloudinary, poster image, sources, and duration of the video
 */
const uploadVideoOnCloudinary = async (localFilePath, folder) => {
    try {
        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            folder: `${ROOT_FOLDER}/${folder}`,
            resource_type: "video",
        });

        let videoDatas = {};

        const originalVideoUrl = response.url;

        VIDEO_QUALITY_ENUM_VALUES.forEach((quality) => {
            const videoConvertedResponse = cloudinary.video(response.public_id, {
                quality: VIDEO_QUALITY_ENUM[quality],
            });
            const extractedData = cloudinaryVideoHtmlExtract(videoConvertedResponse);

            if (extractedData) {
                const { posterUrl, sources } = extractedData;
                videoDatas[quality] = { posterUrl, sources };
            }
        });

        fs.unlinkSync(localFilePath);
        return { originalVideoUrl, videoDatas, duration: response.duration };
    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null;
    }
};

/**
 * Deletes an image from Cloudinary by its file path
 * @param {string} cloudinaryFilePath - The file path of the image to be deleted
 * @returns {Promise<object|null>} - The Cloudinary response object or null if deletion fails
 */
const deleteImageToCloudinary = async (cloudinaryFilePath) => {
    try {
        if (!cloudinaryFilePath) return null;

        const public_id = (ROOT_FOLDER + cloudinaryFilePath.split(ROOT_FOLDER)[1]).split(".")[0];

        return await cloudinary.uploader.destroy(
            public_id,
            { resource_type: "image" },
            (err, _) => {
                if (err) {
                    console.error("Error deleting file:", err);
                }
            }
        );
    } catch (e) {
        console.log("Error deleting cloudinary file: " + e.message);
    }
};

/**
 * Deletes a video from Cloudinary by its file path
 * @param {string} cloudinaryFilePath - The file path of the video to be deleted
 * @returns {Promise<object|null>} - The Cloudinary response object or null if deletion fails
 */
const deleteVideoToCloudinary = async (cloudinaryFilePath) => {
    try {
        if (!cloudinaryFilePath) return null;

        const public_id = ROOT_FOLDER + cloudinaryFilePath.split(ROOT_FOLDER)[1];

        return await cloudinary.uploader.destroy(
            public_id,
            { resource_type: "video" },
            (err, _) => {
                if (err) {
                    console.error("Error deleting file:", err);
                }
            }
        );
    } catch (e) {
        console.log("Error deleting cloudinary file: " + e.message);
    }
};

export {
    uploadImageOnCloudinary,
    uploadVideoOnCloudinary,
    deleteImageToCloudinary,
    deleteVideoToCloudinary,
    cloudinary,
};
