const express = require("express");
const commentRouter = express.Router();
const {
    createComment,
    editComment,
    getAllComments,
    getOneComment
} = require("../controllers/commentController");
commentRouter.route("/comment/createComment/:contributionId").post(createComment);
commentRouter.route("/comment/editComment/:commentId").patch(editComment);
commentRouter.route("/comment/getAllComments").get(getAllComments);
commentRouter.route("/comment/getOneComment/:commentId").get(getOneComment);

module.exports = commentRouter;