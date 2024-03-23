const express = require("express");
const studentRouter = express.Router();
const verifiedAuthorizedUser = require("..//middleware/authMiddleware");
const {
    registerStudent,
    getAllStudents,
    loginAcc,
    verifyEmail,
    forgotPassword,
    resetPassword,
    uploadFile,
    uploadFileToMongoDB,
    getAllFiles,
    downloadFileFromMongoDB,
    updateFileInMongoDB,
    updateFile,
    updateFileStatus,
    deleteFileFromMongoDB
} = require("../controllers/studentControllers");
studentRouter.route("/register").post(registerStudent);
studentRouter.route("/login").post(loginAcc);
studentRouter.route("/students").get(verifiedAuthorizedUser, getAllStudents);
studentRouter.route("/user/:id/verify/:token").get(verifyEmail);
studentRouter.route("/forgotpassword").post(forgotPassword);
studentRouter.route("/user/:id/forgot-password/:token").post(resetPassword);
studentRouter.route("/file/uploadFile").post(uploadFile,uploadFileToMongoDB);
studentRouter.route("/file/getAllFiles").get(getAllFiles);
studentRouter.route("/file/download").post(downloadFileFromMongoDB);
studentRouter.route("/file/update/:fileId").patch(updateFile,updateFileInMongoDB);
studentRouter.route("/file/updateFileStatus/:fileId").patch(updateFileStatus);
studentRouter.route("/file/delete/:fileId").delete(deleteFileFromMongoDB);

module.exports = studentRouter;
