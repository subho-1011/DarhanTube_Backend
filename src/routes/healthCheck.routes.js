import { Router } from "express";

const router = Router();

router.get("/", (_, res) => {
    res.status(200).json({
        success: true,
        code: 200,
        message: "I am healthy and tasty",
    });
});

export default router;
