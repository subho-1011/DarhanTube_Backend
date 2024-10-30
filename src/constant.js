/**
 * List of constants used in the application
 */

/**
 * CORS_ORIGIN - List of origins allowed to make requests to the API
 */
export const CORS_ORIGIN =
    process.env.NODE_ENV === "production"
        ? ["https://darhan-tube.vercel.app"]
        : ["http://localhost:3000"];
