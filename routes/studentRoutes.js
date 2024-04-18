const express = require("express");
const studentRouter = express.Router();
const verifyAdmin = require("../middleware/verifyAdmin");
const verifyMarketingManager = require("../middleware/verifyMarketingManager");
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
    getFileById,
    getFileViewer,
    downloadFileFromMongoDB,
    updateFileInMongoDB,
    updateFile,
    updateFileStatus,
    deleteFileFromMongoDB,
    contributionOverview,
    countOfUserAsType,
} = require("../controllers/studentControllers");
const getSpecificData = require("../controllers/profileController");
studentRouter.route("/profile/me").get(getSpecificData);
studentRouter.route("/register").post(registerStudent);
studentRouter.route("/login").post(loginAcc);
studentRouter.route("/students").get(verifiedAuthorizedUser, getAllStudents);
studentRouter.route("/user/:id/verify/:token").get(verifyEmail);
studentRouter.route("/forgotpassword").post(forgotPassword);
studentRouter.route("/user/:id/forgot-password/:token").post(resetPassword);
studentRouter.route("/overview/contributionOverview").get(contributionOverview);
studentRouter.route("/users").get(countOfUserAsType);
studentRouter
    .route("/file/uploadFile")
    .post(verifiedAuthorizedUser, uploadFileToMongoDB);
studentRouter
    .route("/file/getAllFiles")
    .get(verifiedAuthorizedUser, getAllFiles);
studentRouter
    .route("/file/getFileById/:fileId")
    .get(verifiedAuthorizedUser, getFileById);
studentRouter.route("/file/getFileViewer/:fileId").get(getFileViewer);
studentRouter
    .route("/file/download")
    .post(
        verifiedAuthorizedUser,
        verifyMarketingManager,
        downloadFileFromMongoDB
    );
studentRouter
    .route("/file/update/:fileId")
    .patch(verifiedAuthorizedUser, updateFileInMongoDB);
studentRouter.route("/file/updateFileStatus/:fileId").patch(updateFileStatus);
studentRouter.route("/file/delete/:fileId").delete(deleteFileFromMongoDB);

module.exports = studentRouter;
