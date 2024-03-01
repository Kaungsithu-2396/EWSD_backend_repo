const express = require("express");
const studentRouter = express.Router();
const verifiedAuthorizedUser = require("..//middleware/authMiddleware");
const {
    registerStudent,
    getAllStudents,
    loginAcc,
    verifyEmail,
} = require("../controllers/studentControllers");
studentRouter.route("/register").post(registerStudent);
studentRouter.route("/login").post(loginAcc);
studentRouter.route("/students").get(verifiedAuthorizedUser, getAllStudents);
studentRouter.route("/user/:id/verify/:token").get(verifyEmail);
module.exports = studentRouter;
