const mongoose = require("mongoose");
const { Schema } = mongoose;
const commentSchema = new mongoose.Schema({
    contribution: {
        type: String,
        required: true
    },
    contributor: {
        type: String,
        required: true
    },
    commentOwner: {
        type: String,
        required: true
    },
    comment: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
});

const Comment = mongoose.models.Comment || mongoose.model("Comment", commentSchema);

module.exports = Comment;