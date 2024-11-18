import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrorResponse } from "../utils/handleApiResponse.js";

const verifyJwt = asyncHandler(async (req, res, next) => {
    const token =
        req.cookies?.accessToken ||
        (req.header("Authorization")?.startsWith("Bearer ")
            ? req.header("Authorization").replace("Bearer ", "")
            : null);

    if (!token) {
        throw new ApiErrorResponse(401, "Access token not provided");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

    if (!user) {
        throw new ApiErrorResponse(401, "Unauthorized: user not found");
    }

    req.user = user;
    next();
});

// only for add user to req
const verifyJwtOptional = asyncHandler(async (req, res, next) => {
    const token =
        req.cookies?.accessToken ||
        (req.header("Authorization")?.startsWith("Bearer ")
            ? req.header("Authorization").replace("Bearer ", "")
            : null);

    if (!token) {
        return next();
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select("-password -refreshToken -email -__v");

    if (!user) {
        return next();
    }

    req.user = user;
    next();
});

export { verifyJwt, verifyJwtOptional };
