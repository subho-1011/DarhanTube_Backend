import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { CORS_ORIGIN } from "./constant.js";

const app = express();

app.use(
    cors({
        origin: CORS_ORIGIN,
        credentials: true,
    })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(express.static("public"));

app.use(cookieParser());

app.get("/", (req, res, next) => {
    res.json({
        success: true,
        code: 200,
        message: "Welcome to Darshan Tube Backend",
        github: "https://github.com/subho-1011",
        cors: CORS_ORIGIN,
        NODE_ENV: process.env.NODE_ENV,
    });
});

// import routes
import healthCheckRoutes from "./routes/healthCheck.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import videosRoutes from "./routes/videos.routes.js";
import channelRoutes from "./routes/channels.routes.js";
import watchLaterRoutes from "./routes/watch-later.routes.js";
import watchHistoryRoutes from "./routes/watch-history.routes.js";
import playlistRoutes from "./routes/playlists.routes.js";
import communityRoutes from "./routes/community.routes.js";
import supportQuestionRoutes from "./routes/support-question.routes.js";

// define routes
app.use("/api/v1/healthCheck", healthCheckRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/videos", videosRoutes);
app.use("/api/v1/channels", channelRoutes);
app.use("/api/v1/watch-later", watchLaterRoutes);
app.use("/api/v1/watch-history", watchHistoryRoutes);
app.use("/api/v1/playlists", playlistRoutes);
app.use("/api/v1/community-posts", communityRoutes);
app.use("/api/v1/support-questions", supportQuestionRoutes);

// error handler
import { ApiErrorResponse } from "./utils/handleApiResponse.js";

app.use((err, req, res, next) => {
    console.log(err);
    const errorStatus = err.status || 500;
    const errorMessage = err.message || "Something went wrong!";

    return res
        .status(errorStatus)
        .json(new ApiErrorResponse(errorStatus, errorMessage, err?.errors, err?.stack, false));
});

export default app;
