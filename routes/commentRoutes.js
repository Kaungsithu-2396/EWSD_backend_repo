const express = require("express");
const commentRouter = express.Router();
const {
    createComment,
    editComment,
    getAllComments,
    getOneComment
} = require("../controllers/commentController");
commentRouter.route("/createComment/:contributionId").post(createComment);
commentRouter.route("/editComment/:commentId").patch(editComment);
commentRouter.route("/getAllComments").get(getAllComments);
commentRouter.route("/getOneComment/:commentId").get(getOneComment);

module.exports = commentRouter;