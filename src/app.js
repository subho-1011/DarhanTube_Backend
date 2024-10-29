import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || [];

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(express.static("public"));

app.use(cookieParser());

app.get("/", (req, res, next) => {
    res.send("Welcome to DarshanTech Backend API");
});

// import routes
import healthCheckRoutes from "./routes/healthCheck.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";

// define routes
app.use("/api/v1/healthCheck", healthCheckRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);

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
