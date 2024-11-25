import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
    answer: {
        type: String,
        required: true,
        maxlength: 500,
        minlength: 10,
    },
    answerBy: {
        type: String,
        required: true,
    },
    answerByEmail: {
        type: String,
    },
    isEdited: {
        type: Boolean,
        default: false,
    },
    answeredAt: {
        type: Date,
        default: Date.now,
    },
});

const supportQuestionSchema = new mongoose.Schema(
    {
        question: {
            type: String,
            required: true,
            maxlength: 500,
            minlength: 10,
        },
        questionBy: {
            type: String,
            required: true,
        },
        questionByEmail: {
            type: String,
        },
        screenshot: {
            type: String,
        },
        isEdited: {
            type: Boolean,
            default: false,
        },
        isAnswered: {
            type: Boolean,
            default: false,
        },
        noOfAnswers: {
            type: Number,
            default: 0,
        },
        answers: [answerSchema],
    },
    { timestamps: true }
);

const SupportQuestion = mongoose.model("SupportQuestion", supportQuestionSchema);

export default SupportQuestion;
