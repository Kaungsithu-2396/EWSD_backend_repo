const studentModel = require("../Models/studentModel");
const asyncHandler = require("express-async-handler");
const tokenModel = require("../Models/tokenModel");
const fileModel = require("../Models/fileModel");
const sendMailtoClient = require("../util/sendMail");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const rtg = require("random-token-generator");
const multer = require("multer");
const academicYearModel = require("../Models/academicYearModel");
const facultyModel = require("../Models/facultyModel");

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
});

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
    const url = `${process.env.BASE_URL}/activate-email?id=${newStudent.id}&token=${token.token}`;
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
    const url = `${process.env.BASE_URL}/reset-password?id=${verifiedExisitingEmail.id}&token=${token}`;
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
//@desc Upload files
//@route POST /api/v1/upload-file
//@access Private

const uploadFileToMongoDB = asyncHandler(async (req, resp) => {
    const { title, termsAgreed, files, chosenAcademicYear } = req.body; // Get other relevant data from the request body

    if (!files || files.length === 0) {
        resp.status(400);
        throw new Error("No files uploaded");
    }

    const uploadedFiles = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!title) {
            resp.status(400);
            throw new Error("Please provide a title name");
        }

        if (!termsAgreed) {
            resp.status(400);
            throw new Error(
                "You must agree to the terms before uploading files"
            );
        }

        // Create a new instance of file model and save it to MongoDB
        const newFile = await fileModel.create({
            title,
            chosenAcademicYear,
            fileBuffer: file.chunks.join(""),
            termsAgreed,
            article: file.name,
            fileType: file.type,
            documentOwner: req.student.id,
            faculty: req.student.faculty,
            createdAt: new Date(),
        });
        console.log("done");
        uploadedFiles.push(newFile);
    }

    //send mail to mcr under the same faculty
    const respectiveMCR = await studentModel.find({
        role: "marketing coordinator",
        faculty: req.student.faculty,
    });
    if (uploadedFiles.length > 0) {
        await sendMailtoClient(
            respectiveMCR[0].email,
            `Document submited by ${req.student.name}`
        );
    }

    resp.status(201).send({
        message: "Files uploaded successfully",
        data: uploadedFiles,
        success: true,
    });
});

// const getAllFiles = asyncHandler(async (req, res) => {
//   try {
//     // Constructing query
//     const query = fileModel.find().populate({
//       path: 'documentOwner',
//       select: 'name role -_id', // Select the fields you want from the user document
//     });
//     // Counting
//     const totalDocuments = await fileModel.countDocuments();
//     // Executing query
//     const files = await query.exec();
//     const filesWithOwnerNames = files.map(file => ({
//       ...file.toObject(),
//       documentOwner: file.documentOwner.name,
//       role:file.documentOwner.role
//     }));
//     res.status(200).json({
//       success: true,
//       data: filesWithOwnerNames,
//       totalDocuments,
//     });
//   } catch (error) {
//     console.error(error); // Log the error for debugging
//     res.status(500).json({
//       success: false,
//       error: error.message, // Return the error message to the client
//     });
//   }
// });
const getAllFiles = asyncHandler(async (req, res) => {
    try {
        const userRole = req.student.role;

        let query = fileModel.find().populate({
            path: "documentOwner",
            select: "name _id", // Select the fields you want from the user document
        });
        console.log("Role:", userRole);
        // If the user role is marketing coordinator, filter files based on the faculty
        if (
            userRole === "marketing coordinator" ||
            userRole === "student" ||
            userRole === "guest"
        ) {
            const userFaculty = req.student.faculty; // Assuming the faculty is stored in req.user.faculty
            console.log("Faculty:", userFaculty);
            query = query.where("faculty").equals(userFaculty);
        }

        if (userRole === "marketing manager") {
            query = query.where("status").equals("approved");
        }

        // Executing query
        const files = await query.exec();

        const filesWithOwnerNames = files.map((file) => ({
            ...file.toObject(),
            documentOwner: file.documentOwner.name,
            documentOwnerId: file.documentOwner._id,
            commentId: file.commentId || "",
            comments: file.comments || "",
            faculty: file.faculty,
        }));
        console.log("filesWithOwnerNames", filesWithOwnerNames);
        res.status(200).json({
            success: true,
            data: filesWithOwnerNames,
            totalDocuments: files.length, // Use files.length instead of totalDocuments for the count
        });
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({
            success: false,
            error: error.message, // Return the error message to the client
        });
    }
});
const getFileById = asyncHandler(async (req, res) => {
    try {
        const { fileId } = req.params;
        console.log("fileId", fileId);
        const fileIdObj = new mongoose.Types.ObjectId(fileId);
        const userRole = req.student.role;
        let query = fileModel.findById(fileIdObj).populate({
            path: "documentOwner",
            select: "name role -_id", // Select the fields you want from the user document
        });
        // If the user role is marketing coordinator, add filter based on faculty
        if (userRole === "marketing coordinator") {
            const userFaculty = req.student.faculty;
            query = query.where("faculty").equals(userFaculty);
        }
        const file = await query.exec();
        if (!file) {
            return res.status(404).json({
                success: false,
                error: "File not found",
            });
        }
        const fileWithOwnerName = {
            ...file.toObject(),
            documentOwner: file.documentOwner.name,
            role: file.documentOwner.role,
        };
        res.status(200).json({
            success: true,
            data: fileWithOwnerName,
        });
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({
            success: false,
            error: error.message, // Return the error message to the client
        });
    }
});
const getFileViewer = asyncHandler(async (req, res) => {
    try {
        const { fileId } = req.params;

        const fileIdObj = new mongoose.Types.ObjectId(fileId);
        const file = await fileModel.findById(fileIdObj);

        if (!file) {
            return res.status(404).json({
                success: false,
                error: "File not found",
            });
        }
        const userProfile = await studentModel.findById(file.documentOwner);

        file.views += 1;
        let data = await file.save();
        const updateData = {
            data: data,
            author: userProfile?.name || "-",
        };
        res.status(200).json({
            success: true,
            updateData,
        });
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({
            success: false,
            error: error.message, // Return the error message to the client
        });
    }
});
// download multiple files
const downloadFileFromMongoDB = asyncHandler(async (req, res) => {
    const userRole = req.student.role; // Extract user role from the request
    // Check if user role is Marketing Manager
    if (userRole !== "marketing manager") {
        return res.status(403).json({
            status: "fail",
            message:
                "Unauthorized. Only Marketing Managers are allowed to download files.",
        });
    }
    const { fileIds } = req.body; // Extract fileIds from request body

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
        return res.status(400).json({
            status: "fail",
            message:
                "File IDs must be provided as a non-empty array in the request body.",
        });
    }

    // Create an array to store promises for retrieving files
    const filePromises = fileIds.map(async (fileId) => {
        const fileIdObj = new mongoose.Types.ObjectId(fileId);
        // Query MongoDB to find the file by its ID
        const file = await fileModel.findById(fileIdObj);

        if (!file) {
            throw new Error(`File with ID ${fileId} not found`);
        }

        // Retrieve file data from MongoDB document
        const fileName = file.article;
        const fileBuffer = file.fileBuffer;

        return { fileName, fileBuffer };
    });

    // Wait for all file retrieval promises to resolve
    const files = await Promise.all(filePromises);

    // Creating a zip file
    const JSZip = require("jszip");
    const zip = new JSZip();
    files.forEach(({ fileName, fileBuffer }) => {
        zip.file(fileName, fileBuffer);
    });
    const zipStream = zip.generateNodeStream({
        type: "nodebuffer",
        streamFiles: true,
    });
    // Set response headers for file download
    res.set({
        "Content-Type": "application/zip",
        "Content-Disposition": "attachment; filename=download.zip",
    });

    // Pipe the zip stream to the response
    zipStream.pipe(res);
});
// update File
// const updateFileInMongoDB = asyncHandler(async (req, res) => {
//     const { fileId } = req.params;
//     const fileIdObj = new mongoose.Types.ObjectId(fileId);
//     const {title,termsAgreed} = req.body;
//     console.log("title",title);
//     // Validate request body
//     if (!title) {
//         return res.status(400).json({ status: 'fail', message: 'Title must be provided in the request body' });
//     }

//     try {
//         const file = await fileModel.findOne({ _id: fileIdObj });
//         console.log("file", file);
//         if (!file) {
//             return res.status(404).json({ status: 'fail', message: 'File not found' });
//         }

//         if (!termsAgreed) {
//             resp.status(400);
//             throw new Error("You must agree to the terms before uploading files");
//           }

//         // Update fileName
//         file.title = title;
//         // If a new file is uploaded, update fileBuffer, fileType, and article
//         if (req.files && req.files.length > 0) {
//             const newFile = req.files[0];
//             file.fileBuffer = newFile.buffer;
//             file.fileType = newFile.mimetype;
//             file.article = Buffer.from(newFile.originalname, "latin1").toString("utf-8");
//         }
//         // Save the updated file document
//         await file.save();

//         res.status(200).json({
//             status: 'success',
//             message: 'File updated successfully',
//             termsAgreed,
//             updatedFileName: file.title,
//             article: file.article,
//             updatedAt:new Date(),
//         });
//     } catch (error) {
//         console.error("Error finding file:", error);
//         return res.status(500).json({ status: 'fail', message: 'Error finding file' });
//     }
// });

const updateFileInMongoDB = asyncHandler(async (req, resp) => {
    const userRole = req.student.role;
    if (userRole !== "marketing coordinator" && userRole !== "student") {
        return resp.status(403).json({
            status: "fail",
            message:
                "Unauthorized. Only Marketing Coordinator are allowed to update files.",
        });
    }
    const { title, termsAgreed, files, chosenAcademicYear } = req.body; // Get title and termsAgreed from the request body
    const { fileId } = req.params;
    const fileIdObj = new mongoose.Types.ObjectId(fileId);

    if (!fileId) {
        resp.status(400);
        throw new Error("File ID is required for updating");
    }

    // Find the file in MongoDB by ID
    const existingFile = await fileModel.findById(fileIdObj);

    if (!existingFile) {
        resp.status(404);
        throw new Error("File not found");
    }

    // Update the title if provided
    if (title) {
        existingFile.title = title;
    }

    // Check if termsAgreed is provided
    if (termsAgreed !== undefined) {
        existingFile.termsAgreed = termsAgreed;
    }

    if (chosenAcademicYear) {
        existingFile.chosenAcademicYear = chosenAcademicYear;
    }

    // Handle file update if a new file is uploaded
    for (let i = 0; i < files.length; i++) {
        // const newFile = await fileModel.create({
        //   title,
        //   chosenAcademicYear,
        //   fileBuffer: file.chunks.join(""),
        //   termsAgreed,
        //   article: file.name,
        //   fileType: file.type,
        //   documentOwner: req.student.id,
        //   faculty: req.student.faculty,
        //   createdAt: new Date(),
        // });
        // console.log("done");
        // uploadedFiles.push(newFile);
        const file = files[i];

        // Update the file data if a new file is uploaded
        (existingFile.fileBuffer = file.chunks.join("")),
            (existingFile.article = file.name);
        existingFile.fileType = file.type;
        existingFile.createdAt = new Date();
    }

    // Save the updated file back to MongoDB
    const updatedFile = await existingFile.save();

    resp.status(200).send({
        message: "File updated successfully",
        data: updatedFile,
        success: true,
    });
});

// delete File From MongoDB
const deleteFileFromMongoDB = asyncHandler(async (req, res) => {
    const { fileId } = req.params; // Extract fileId from request parameters
    const fileIdObj = new mongoose.Types.ObjectId(fileId);

    // Query MongoDB to find the file by its ID
    const file = await fileModel.findById(fileIdObj);

    if (!file) {
        return res
            .status(404)
            .json({ status: "fail", message: "File not found" });
    }

    // Delete the file from MongoDB
    await fileModel.findByIdAndDelete(fileIdObj);

    // Respond with success message
    res.status(200).json({
        status: "success",
        message: "File deleted successfully",
    });
});

const updateFileStatus = asyncHandler(async (req, res) => {
    const { fileId } = req.params;
    const fileIdObj = new mongoose.Types.ObjectId(fileId);
    const { title, status } = req.body;

    // Validate request body
    if (!status || !["submitted", "approved", "edited"].includes(status)) {
        return res
            .status(400)
            .json({ status: "fail", message: "Invalid status provided" });
    }

    try {
        const file = await fileModel.findOne({ _id: fileIdObj });
        if (!file) {
            return res
                .status(404)
                .json({ status: "fail", message: "File not found" });
        }

        // Update file status
        file.status = status;
        await file.save();

        res.status(200).json({
            status: "success",
            message: "File status updated successfully",
            title,
            artcile: file.article,
            updatedStatus: file.status,
            updatedAt: new Date(),
        });
    } catch (error) {
        console.error("Error updating file status:", error);
        return res
            .status(500)
            .json({ status: "fail", message: "Error updating file status" });
    }
});
const dataMapping = asyncHandler(async (id, modelName) => {
    const objectId = typeof id === "string" && new mongoose.Types.ObjectId(id);
    const getpropertyAsId = await modelName.findById(id);

    if (!getpropertyAsId) {
        throw new Error(`${id} is invalid`);
    }
    // const { year, name } = getpropertyAsId;
    return getpropertyAsId;
});

const countStudentsByFacultyAndYear = (studentsData) => {
    return studentsData.reduce((acc, { faculty, academicYear }) => {
        if (!acc[faculty]) {
            acc[faculty] = {};
        }
        if (!acc[faculty][academicYear]) {
            acc[faculty][academicYear] = 0;
        }
        acc[faculty][academicYear]++;
        return acc;
    }, {});
};

const contributionOverview = asyncHandler(async (req, resp) => {
    const allFiles = await fileModel.find().select("-fileBuffer");
    const transformList = [];
    const contributorList = [];

    for (let el of allFiles) {
        const faculty = await dataMapping(el.faculty, facultyModel);
        const user = await dataMapping(el.documentOwner, studentModel);

        const academicYear = await dataMapping(
            el.chosenAcademicYear,
            academicYearModel
        );

        transformList.push({
            id: el.id,
            user: user.name,
            academicYear: academicYear.year,
            faculty: faculty.name,
        });
    }

    const contributor = countStudentsByFacultyAndYear(transformList);
    for (const [key, value] of Object.entries(contributor)) {
        const [key_1, value_1] = Object.entries(value);
        contributorList.push({
            faculty: key,
            academicYear: key_1[0],
            count: key_1[1],
        });
    }
    resp.status(200).send({
        contribution: transformList,
        contributor: contributorList,
    });
});
const countOfUserAsType = asyncHandler(async (req, resp) => {
    const user = await studentModel.find();
    const coll = {};
    const result = [];
    user.forEach((el) => (coll[el.role] = (coll[el.role] || 0) + 1));

    for (let [key, value] of Object.entries(coll)) {
        result.push({
            user: key,
            count: value,
        });
    }
    resp.status(200).send({
        message: "success",
        data: result,
    });
});
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.SECRET_KEY, {
        expiresIn: "2d",
    });
};
module.exports = {
    countOfUserAsType,
    registerStudent,
    getAllStudents,
    loginAcc,
    verifyEmail,
    forgotPassword,
    resetPassword,
    uploadFileToMongoDB,
    getAllFiles,
    getFileViewer,
    getFileById,
    downloadFileFromMongoDB,
    deleteFileFromMongoDB,
    updateFileInMongoDB,
    updateFileStatus,
    contributionOverview,
};
