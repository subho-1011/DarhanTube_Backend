import { Router } from "express";

import * as playlistsCtrl from "../controllers/playlists.controller.js";
import { verifyJwt, verifyJwtOptional } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", verifyJwtOptional, playlistsCtrl.getPlaylists);
router.get("/search", verifyJwtOptional, playlistsCtrl.searchPlaylists);
router.get("/slug/:slug", verifyJwtOptional, playlistsCtrl.getPlaylistBySlug);
router.get("/users/:id", verifyJwtOptional, playlistsCtrl.getPlaylistsByUser);

router.post("/", verifyJwt, playlistsCtrl.createPlaylist);
router.get("/:id", verifyJwtOptional, playlistsCtrl.getPlaylistById);
router.patch("/:id", verifyJwt, playlistsCtrl.updatePlaylistById);
router.delete("/:id", verifyJwt, playlistsCtrl.deletePlaylistById);

router.post("/:id/videos/:videoSlug", verifyJwt, playlistsCtrl.addVideoToPlaylist);
router.delete("/:id/videos/:videoId", verifyJwt, playlistsCtrl.removeVideoFromPlaylist);

router.post("/:id/privacy", verifyJwt, playlistsCtrl.togglePublic);

export default router;
