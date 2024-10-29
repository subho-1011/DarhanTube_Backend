import mongoose from "mongoose";

const dbConfig = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGODB_URI}/${process.env.MONGODB_DB_NAME}`
        );

        console.log(`Database connected to ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

export default dbConfig;
