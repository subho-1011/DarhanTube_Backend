import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
    {
        subscriberId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        subscribedToId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

subscriptionSchema.index({ subscriberId: 1, subscribedToId: 1 }, { unique: true });

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
