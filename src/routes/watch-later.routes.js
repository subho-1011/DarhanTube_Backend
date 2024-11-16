import { Router } from "express";

const router = Router();

// Routes
import {
    getWatchLaterVideos,
    addVideoToWatchLater,
    removeVideoFromWatchLater,
} from "../controllers/watch-later.controller.js";
import { verifyJwt } from "../middlewares/index.js";

router.use(verifyJwt);

router.route("/").get(getWatchLaterVideos);
router.route("/:videoId").post(addVideoToWatchLater);
router.route("/:videoId").delete(removeVideoFromWatchLater);

export default router;
