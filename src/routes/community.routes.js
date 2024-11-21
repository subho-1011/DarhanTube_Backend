import { Router } from "express";

import * as communityCtrl from "../controllers/community.controller.js";

import { verifyJwtOptional } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(verifyJwtOptional);

router.route("/").get(communityCtrl.getPosts);
router.route("/").post(upload.fields([{ name: "image", maxCount: 1 }]), communityCtrl.createPost);
router.route("/users/:userId").get(communityCtrl.getUserPosts);
router.route("/:id").get(communityCtrl.getPost).patch(communityCtrl.updatePost).delete(communityCtrl.deletePost);

router.route("/:id/like").post(communityCtrl.likePost);

router.route("/:id/comments").get(communityCtrl.getCommentsOfPost).post(communityCtrl.createComment);
router.route("/:id/comments/:commentId").delete(communityCtrl.deleteCommentOfPost);

export default router;
