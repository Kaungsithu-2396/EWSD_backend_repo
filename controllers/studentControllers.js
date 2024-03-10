const studentModel = require("../Models/studentModel");
const asyncHandler = require("express-async-handler");
const tokenModel = require("../Models/tokenModel");
const sendMailtoClient = require("../util/sendMail");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const rtg = require("random-token-generator");
//@desc getAllStudents
//@route POST /api/v1/students
//@access Private
const getAllStudents = asyncHandler(async (req, resp) => {
    const students = await studentModel.find().select("-password");

    if (req.student && req.student.role === "admin") {
        resp.status(200).send({
            message: "all students",
            students,
        });
    } else {
        resp.status(403);
        throw new Error("Only Admin can access");
    }
});
//@desc RegisterStudent
//@route POST /api/v1/register
//@access Public
const registerStudent = asyncHandler(async (req, resp) => {
    const { name, email, password, role, faculty, academicYear, termsAgreed } =
        req.body;
    if (!name || !email || !password || !faculty || !academicYear) {
        resp.status(400);
        throw new Error("fail to provide the complete data");
    }
    const isExisitingUser = await studentModel.findOne({ email });
    if (isExisitingUser) {
        resp.status(400);
        throw new Error(
            `User already Exisit with this ${isExisitingUser.email}`
        );
    }
    //generate salt to mix with password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    const newStudent = await studentModel.create({
        name,
        email,
        password: hashPassword,
        role,
        faculty,
        academicYear,
        termsAgreed,
    });
    const token = await tokenModel.create({
        userId: newStudent.id,
        token: crypto.randomBytes(40).toString("hex"),
    });
    const url = `${process.env.BASE_URL}/user/${newStudent.id}/verify/${token.token}`;
    await sendMailtoClient(
        newStudent.email,
        "Here is the email verification for EWSD_Project",
        url
    );
    resp.status(201).send({
        message: "Please verify the email",
        token: generateToken(newStudent.id, newStudent.role),
    });
});
//@desc loginAcc
//@route POST /api/v1/register
//@access Public
const loginAcc = asyncHandler(async (req, resp) => {
    const { email, password } = req.body;
    if (!email || !password) {
        resp.status(400);
        throw new Error("Incomplete data providence");
    }
    const isUserAlreadyRegistered = await studentModel.findOne({ email });
    if (!isUserAlreadyRegistered) {
        resp.status(404);
        throw new Error("Please register first");
    }
    //prohibiting the unverified users to log in
    if (isUserAlreadyRegistered.verified === false) {
        resp.status(401);
        throw new Error("Email verification process is left to do");
    }
    if (await bcrypt.compare(password, isUserAlreadyRegistered.password)) {
        resp.status(201).send({
            message: "authorized",
            student: isUserAlreadyRegistered,
            token: generateToken(
                isUserAlreadyRegistered.id,
                isUserAlreadyRegistered.role
            ),
        });
    } else {
        resp.status(400);
        throw new Error("Incorrect password");
    }
});
//@desc forgrot password
//@route POST /api/v1/forgot-password
//@access PUBLIC
const forgotPassword = asyncHandler(async (req, resp) => {
    const { email } = req.body;
    const verifiedExisitingEmail = await studentModel.findOne({ email });
    if (!verifiedExisitingEmail) {
        resp.status(401);
        throw new Error(`User with this email ${email} does not exisit`);
    }
    const token = crypto.randomBytes(40).toString("hex");
    await tokenModel.updateOne({ userId: verifiedExisitingEmail.id, token });
    const url = `${process.env.BASE_URL}/user/${verifiedExisitingEmail.id}/forgot-password/${token}`;
    await sendMailtoClient(
        verifiedExisitingEmail.email,
        "Password Reset Link",
        url
    );
    resp.status(201).send({
        message: "password reset email has been sent",
    });
});
//@desc resetpassword
//@route api/v1/user/:id/forgot-password/:token
//@access PUBLIC
const resetPassword = asyncHandler(async (req, resp) => {
    const { id, token } = req.params;
    const { password } = req.body;

    const isUserExisit = await studentModel.findById(id);
    const verifiedToken = await tokenModel.find({
        userId: isUserExisit.id,
        token,
    });
    if (!isUserExisit) {
        throw new Error("User does not exisit with this email");
    }
    if (!token || !verifiedToken) {
        resp.status(401);
        throw new Error("invalid link");
    }
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    await studentModel.findByIdAndUpdate(
        id,
        {
            password: hashPassword,
        },
        {
            new: true,
        }
    );
    resp.status(201).send({
        message: "password reset success",
        token: generateToken(isUserExisit.id, isUserExisit.role),
    });
});
const verifyEmail = asyncHandler(async (req, resp) => {
    const { id, token } = req.params;
    if (!id || !token) {
        resp.status(400);
        throw new Error("wrong url");
    }
    const user = await studentModel.findById(id);
    if (!user) {
        resp.status(401);
        throw new Error("no user found with this id");
    }
    const tokenVerify = await tokenModel.findOne({
        userId: user.id,
        token,
    });
    if (!tokenVerify) {
        resp.status(401);
        throw new Error("Invalid link");
    }

    await studentModel.findByIdAndUpdate(
        user.id,
        {
            verified: true,
        },
        {
            new: true,
        }
    );

    resp.status(201).send({
        message: "email verification successfully done",
    });
});
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.SECRET_KEY, {
        expiresIn: "2d",
    });
};
module.exports = {
    registerStudent,
    getAllStudents,
    loginAcc,
    verifyEmail,
    forgotPassword,
    resetPassword,
};
