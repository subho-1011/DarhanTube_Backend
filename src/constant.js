/**
 * List of constants used in the application
 */

/**
 * CORS_ORIGIN - List of origins allowed to make requests to the API
 */
export const CORS_ORIGIN =
    process.env.CORS_ORIGIN === "*"
        ? "*"
        : process.env.CORS_ORIGIN.split(",") || "https://darshan-tube.vercel.app";
