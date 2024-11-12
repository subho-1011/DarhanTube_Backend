import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import ms from "ms";

const sessionSchema = new Schema({
    refreshToken: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    _id: false,
});

export const Session = mongoose.model("Session", sessionSchema);

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            minlength: 3,
            maxlength: 20,
            trim: true,
        },
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            minlength: 5,
            maxlength: 20,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [/\S+@\S+\.\S+/, "Please use a valid email address"],
        },
        password: {
            type: String,
            minlength: 6,
            maxlength: 20,
            required: [true, "Password is required"],
            select: false,
        },
        role: {
            type: String,
            enum: ["admin", "user"],
            default: "user",
        },
        avatarUrl: {
            type: String,
        },
        coverImageUrl: {
            type: String,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        sessions: [sessionSchema],
    },
    { timestamps: true }
);

// Hash password before saving user
userSchema.pre("save", async function (next) {
    try {
        if (!this.isModified("password")) return next();

        this.password = await bcrypt.hash(this.password, 10);
        next();
    } catch (error) {
        return next(error);
    }
});

// Method to check password match
userSchema.methods.isPasswordMatch = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// Generate Access Token
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
        }
    );
};

// Generate Refresh Token
userSchema.methods.generateRefreshToken = function () {
    const refreshToken = jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
        }
    );
    const expiresAt = Date.now() + ms(process.env.REFRESH_TOKEN_EXPIRES_IN);

    return { refreshToken, expiresAt };
};

userSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.refreshToken;
    delete userObject.isVerified;
    delete userObject.updatedAt;
    delete userObject.__v;

    return userObject;
};

const User = mongoose.model("User", userSchema);

export default User;
