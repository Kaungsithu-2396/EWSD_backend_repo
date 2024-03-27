const mongoose = require("mongoose");
const { Schema } = mongoose;
const userSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: [
                "student",
                "marketing coordinator",
                "marketing manager",
                "admin",
                "guest",
            ],
            required: true,
            default: "student",
        },
        faculty: {
            type: Schema.Types.ObjectId,
            ref: "Faculty",
        },
        academicYear: {
            type: Schema.Types.ObjectId,
            ref: "academicYear",
        },
        termsAgreed: {
            type: Boolean,
            required: true,
            default: false,
        },
        verified: {
            type: Boolean,
            required: true,
            default: false,
        }
    },
    {
        timestamps: true,
    }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

module.exports = User;
