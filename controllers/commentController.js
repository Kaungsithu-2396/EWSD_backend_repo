const commentModel = require("../Models/commentModel");
const studentModel = require("../Models/studentModel");
const fileModel = require("../Models/fileModel");
const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const createComment = asyncHandler(async (req, resp) => {
    const { commentOwner, comment } = req.body;
    if (!commentOwner || !comment) {
        resp.status(400);
        throw new Error("incomplete data providence");
    }
    const { contributionId } = req.params; // Corrected req.params spelling
    const contributionIdObj = new mongoose.Types.ObjectId(contributionId);
    const commentOwnerObj = new mongoose.Types.ObjectId(commentOwner);

    let contribution = await fileModel.findById(contributionIdObj);
    let user = await studentModel.findById(commentOwner);

    try {
        // Create a new comment instance
        const newComment = new commentModel({
            contribution: contribution.article,
            contributor: contribution.documentOwner,
            commentOwner: user.name,
            comment,
            createdAt: new Date(), // Added createdAt field with current date
        });

        // Save the new comment to the database
        const data = await newComment.save();
        resp.status(201).send({
            message: "Comment created successfully",
            data,
            success: true,
        });
    } catch (error) {
        // Handle any errors that occur during the process
        console.error("Error creating comment:", error);
        resp.status(500).send({
            // Sending a proper error response
            message: "Error creating comment",
            success: false,
            error: error.message, // Sending error message for debugging
        });
    }
});
const editComment = async (req, res) => {
    const { commentId } = req.params;
    const commentIdObj = new mongoose.Types.ObjectId(commentId);
    const { comment } = req.body;

    try {
        // Find the comment by commentId
        let existingComment = await commentModel.findById(commentIdObj);

        if (!existingComment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        // Update the comment with new text
        existingComment.comment = comment;

        // Save the updated comment to the database
        const updatedComment = await existingComment.save();

        res.status(200).json({
            message: "Comment updated successfully",
            data: updatedComment.comment,
            updatedAt: new Date(),
        });
    } catch (error) {
        console.error("Error updating comment:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
const getAllComments = asyncHandler(async (req, res) => {
    try {
        // Fetch all comments from the database
        const comments = await commentModel.find();
        const totalcomments = await commentModel.countDocuments();

        res.status(200).json({
            message: "All comments retrieved successfully",
            data: comments,
            totalcomments,
            success: true,
        });
    } catch (error) {
        console.error("Error retrieving comments:", error);
        res.status(500).json({
            message: "Internal server error",
            success: false,
            error: error.message,
        });
    }
});
const getOneComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const commentIdObj = new mongoose.Types.ObjectId(commentId);

    try {
        // Find the comment by commentId
        const comment = await commentModel.findById(commentIdObj);

        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        res.status(200).json({
            message: "Comment retrieved successfully",
            data: comment,
            success: true,
        });
    } catch (error) {
        console.error("Error retrieving comment:", error);
        res.status(500).json({
            message: "Internal server error",
            success: false,
            error: error.message,
        });
    }
});

module.exports = {
    createComment,
    editComment,
    getAllComments,
    getOneComment,
};
