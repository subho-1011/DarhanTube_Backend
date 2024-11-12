import User from "../models/user.model.js";
import Subscription from "../models/subscripton.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrorResponse, ApiSuccessResponse } from "../utils/handleApiResponse.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const { user } = req;

    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiErrorResponse(404, "Channel not found");
    }

    const isSubscribed = await Subscription.findOne({
        subscriberId: user._id,
        subscribedToId: channelId,
    });

    if (isSubscribed) {
        await Subscription.deleteOne({ subscriberId: user._id, subscribedToId: channelId });
    } else {
        await Subscription.create({
            subscriberId: user._id,
            subscribedToId: channelId,
        });
    }

    res.status(200).json(
        new ApiSuccessResponse(
            200,
            isSubscribed ? "Channel unsubscribed successfully" : "Channel subscribed successfully"
        )
    );
});

export { toggleSubscription };
