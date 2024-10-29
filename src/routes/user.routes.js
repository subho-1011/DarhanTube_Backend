import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

import {
    getCurrentUser,
    getUserProfile,
    changeProfileAvatar,
    changeProfileCoverImage,
    updateProfile,
} from "../controllers/user.controller.js";

router.use(verifyJwt);

router.route("/me").get(getCurrentUser);

router.route("/profile").get(getUserProfile).patch(updateProfile);
router.route("/profile/avatar").patch(upload.single("avatar"), changeProfileAvatar);

router.route("/profile/cover-image").patch(upload.single("coverImage"), changeProfileCoverImage);

export default router;
