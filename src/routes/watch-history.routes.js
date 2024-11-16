import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJwt);

// Importing the controller
import {
    getWatchHistory,
    createWatchHistory,
    updateWatchHistory,
    deleteWatchHistory,
} from "../controllers/watch-history.controller.js";

// routes
router.route("/").get(getWatchHistory);
router.route("/:videoId").post(createWatchHistory);
router.route("/:videoId").patch(updateWatchHistory);
router.route("/:videoId").delete(deleteWatchHistory);

export default router;
