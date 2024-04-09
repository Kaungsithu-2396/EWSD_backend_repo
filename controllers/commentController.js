const commentModel = require("../Models/commentModel");
const studentModel = require("../Models/studentModel");
const fileModel = require("../Models/fileModel");
const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const createComment = asyncHandler(async (req, resp) => {
    const { commentOwner, comment } = req.body;
    console.log("body",req.body);
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
            contribution: contribution._id,
            contributor: contribution.documentOwner,
            commentOwner: user.name,
            comment,
            createdAt: new Date(), // Added createdAt field with current date
        });
        const savedComment = await newComment.save();
        console.log("Firstcmt",savedComment);
        // Save the new comment to the database
        contribution.comments = comment,
        contribution.commentId = savedComment._id,
        
        // contribution.cmtId +=`${savedComment._id}`;
        console.log("savecmt",savedComment._id);
        await contribution.save();
        
        resp.status(201).send({
            message: "Comment created successfully",
            savedComment,
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
    const { comment,contributionId } = req.body;
    const contributionIdObj = new mongoose.Types.ObjectId(contributionId);
    let contribution = await fileModel.findById(contributionIdObj);
    console.log("Contribution",contribution);
    try {
        // Find the comment by commentId
        let existingComment = await commentModel.findById(commentIdObj);
        console.log("Orginal Comment",existingComment);
        if (!existingComment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        // Update the comment with new text
        existingComment.comment = comment;
        contribution.comments = comment,
        contribution.commentId = existingComment._id,
        await contribution.save();
        console.log("Existing cmt", existingComment);
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
