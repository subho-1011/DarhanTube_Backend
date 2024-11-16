import { Router } from "express";
import { upload, validate, verifyJwt } from "../middlewares/index.js";

const router = Router();

// Routes
import {
    getAllVideos,
    getVideoBySlug,
    getUserVideos,
    getUserDraftVideos,
    getVideoById,
    uploadVideo,
    updateMetaDataOfVideo,
    deleteVideo,
    uploadOrUpdateThumbnail,
    publishVideo,
    toggleVisibility,
    toggleLikeOnVideo,
    getCommentsOfVideo,
    postCommentOnVideo,
    updateCommentOfVideo,
    deleteCommentOfVideo,
    toggleLikeOnCommentOfVideo,
    getUserLikedVideos,
} from "../controllers/videos.controller.js";
import { VideoMetaDataFormSchema, VideoUpdateFormSchema } from "../validators/videos-valiadtions.js";

// Public routes
router.route("/").get(getAllVideos);
router.route("/slug/:slug").get(getVideoBySlug);
router.route("/:videoId/comments").get(getCommentsOfVideo);

router.use(verifyJwt);

router.route("/drafts").get(getUserDraftVideos);
router.route("/users/:username").get(getUserVideos);
router.route("/users/:username/drafts").get(getUserDraftVideos);
router.route("/liked-videos/@me").get(getUserLikedVideos);

router.route("/upload").post(upload.fields([{ name: "video", maxCount: 1 }]), uploadVideo);

router.route("/:videoId").get(getVideoById);
router.route("/:videoId").patch(validate(VideoUpdateFormSchema), updateMetaDataOfVideo);
router.route("/:videoId").delete(deleteVideo);
router.route("/:videoId/thumbnail").patch(upload.single("thumbnail"), uploadOrUpdateThumbnail);
router.route("/:videoId/publish").post(validate(VideoMetaDataFormSchema), publishVideo);
router.route("/:videoId/public").patch(toggleVisibility);

// for other users actions
router.route("/:videoId/like").post(toggleLikeOnVideo);
router.route("/:videoId/comments").post(postCommentOnVideo);
router.route("/:videoId/comments/:commentId").patch(updateCommentOfVideo);
router.route("/:videoId/comments/:commentId").delete(deleteCommentOfVideo);
router.route("/:videoId/comments/:commentId/like").post(toggleLikeOnCommentOfVideo);

export default router;
