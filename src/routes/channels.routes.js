import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

// Routes
import { toggleSubscription } from "../controllers/channels.controller.js";

router.use(verifyJwt);

router.route("/:channelId/subscribe").post(toggleSubscription);

export default router;
