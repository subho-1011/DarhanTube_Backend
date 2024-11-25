import SupportQuestion from "../models/support-question.model.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiSuccessResponse, ApiErrorResponse } from "../utils/handleApiResponse.js";

// Create a new support question
export const createSupportQuestion = asyncHandler(async (req, res) => {
    const supportQuestion = new SupportQuestion(req.body);
    await supportQuestion.save();

    return res
        .status(201)
        .json(new ApiSuccessResponse(201, "Support question created successfully", { supportQuestion }));
});

// Get all support questions
export const getSupportQuestions = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const supportQuestions = await SupportQuestion.find()
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .sort({ createdAt: -1 });

    const totalSupportQuestions = await SupportQuestion.countDocuments();

    if (!supportQuestions) {
        return res.status(404).json(new ApiErrorResponse(404, "Support questions not found"));
    }

    return res.status(200).json(
        new ApiSuccessResponse(200, "All support questions", {
            supportQuestions,
            metadata: { total: Math.ceil(totalSupportQuestions / 10), page: parseInt(page) },
        })
    );
});

// Get a single support question
export const getSupportQuestion = asyncHandler(async (req, res) => {
    const supportQuestion = await SupportQuestion.findById(req.params.id);

    if (!supportQuestion) {
        return res.status(404).json(new ApiErrorResponse(404, "Support question not found"));
    }

    return res.status(200).json(new ApiSuccessResponse(200, "Support question", { supportQuestion }));
});

// Delete a support question
export const deleteSupportQuestion = asyncHandler(async (req, res) => {
    const supportQuestion = await SupportQuestion.findByIdAndDelete(req.params.id);

    if (!supportQuestion) {
        return res.status(404).json(new ApiErrorResponse(404, "Support question not found"));
    }

    return res.status(200).json(new ApiSuccessResponse(200, "Support question deleted successfully"));
});

// Answer a support question
export const createSupportQuestionAnswer = asyncHandler(async (req, res) => {
    const { answer, answerBy, answerByEmail } = req.body;
    if (!answer) {
        return res.status(400).json(new ApiErrorResponse(400, "You must provide an answer to the question"));
    }

    if (!answerBy) {
        return res
            .status(400)
            .json(new ApiErrorResponse(400, "You must provide the name of the person answering the question"));
    }

    const supportQuestion = await SupportQuestion.findById(req.params.id);

    if (!supportQuestion) {
        return res.status(404).json(new ApiErrorResponse(404, "Support question not found"));
    }

    supportQuestion.answers.push({ answer, answerBy, answerByEmail, answeredAt: Date.now() });
    supportQuestion.isAnswered = true;
    supportQuestion.noOfAnswers = supportQuestion.noOfAnswers + 1;

    await supportQuestion.save();

    return res
        .status(200)
        .json(new ApiSuccessResponse(200, "Support question answered successfully", { supportQuestion }));
});
