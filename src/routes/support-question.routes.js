import { Router } from "express";

import * as SupportQuestionCtrl from "../controllers/support.controllers.js";

const router = Router();

router.route("/").get(SupportQuestionCtrl.getSupportQuestions).post(SupportQuestionCtrl.createSupportQuestion);
router.route("/:id").get(SupportQuestionCtrl.getSupportQuestion);

router.route("/:id/answers").post(SupportQuestionCtrl.createSupportQuestionAnswer);

export default router;
