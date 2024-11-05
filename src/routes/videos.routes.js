import { Router } from "express";
import * as middleware from "../middlewares/index.js";

const router = Router();

// Routes
import {
    uploadVideo,
    getUserDraftVideos,
    getVideoById,
    getAllVideos,
    updateMetaDataOfVideo,
    deleteVideo,
    publishVideo,
    uploadOrUpdateThumbnail,
    toggleVisibility,
    getVideoBySlug,
    getUserVideos,
} from "../controllers/videos.controller.js";
import { VideoMetaDataFormSchema, VideoUpdateFormSchema } from "../validators/videos-valiadtions.js";

router.route("/").get(getAllVideos);
router.route("/slug/:slug").get(getVideoBySlug);

router.use(middleware.verifyJwt);

router.route("/drafts").get(getUserDraftVideos);

router.route("/upload").post(middleware.upload.fields([{ name: "video", maxCount: 1 }]), uploadVideo);

router.route("/:videoId").get(getVideoById);
router.route("/:videoId").patch(middleware.validate(VideoUpdateFormSchema), updateMetaDataOfVideo);
router.route("/:videoId").delete(deleteVideo);
router.route("/:videoId/thumbnail").patch(middleware.upload.single("thumbnail"), uploadOrUpdateThumbnail);
router.route("/:videoId/publish").post(middleware.validate(VideoMetaDataFormSchema), publishVideo);
router.route("/:videoId/public").patch(toggleVisibility);

router.route(`/users/:username`).get(getUserVideos);

export default router;
