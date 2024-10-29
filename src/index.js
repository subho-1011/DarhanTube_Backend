import app from "./app.js";
import dotenv from "dotenv";
import dbConfig from "./config/dbConfig.js";

dotenv.config({
    path: "./.env",
});

(async () => {
    try {
        await dbConfig();
        app.listen(process.env.PORT, () => {
            console.log(`Server started on port ${process.env.PORT}`);
        });

        app.on("error", (error) => {
            console.log("Error: ", error);
            throw error;
        });
    } catch (error) {
        console.log("MongoDB connection error: ", error);
        process.exit(1);
    }
})();
