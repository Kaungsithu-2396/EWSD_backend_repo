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
  console.log(req.body);
  if (!name || !email || !password || !faculty || !academicYear) {
    resp.status(400);
    throw new Error("fail to provide the complete data");
  }
  const isExisitingUser = await studentModel.findOne({ email });
  if (isExisitingUser) {
    resp.status(400);
    throw new Error(`User already Exisit with this ${isExisitingUser.email}`);
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
const uploadFile = upload.array("files", 3);
const uploadFileToMongoDB = asyncHandler(async (req, resp) => {
  const { title, termsAgreed } = req.body; // Get other relevant data from the request body

  // console.log("req.files:", req.files);

  if (!req.files || req.files.length === 0) {
    resp.status(400);
    throw new Error("No files uploaded");
  }

  const uploadedFiles = [];

  for (let i = 0; i < req.files.length; i++) {
    const file = req.files[i];

    // Process each file
    file.originalname = Buffer.from(file.originalname, "latin1").toString(
      "utf-8"
    );

    if (!title) {
      resp.status(400);
      throw new Error("Please provide a title name");
    }

    if (!termsAgreed) {
      resp.status(400);
      throw new Error("You must agree to the terms before uploading files");
    }

    const fileBuffer = file.buffer; // File data in memory

    // Create a new instance of file model and save it to MongoDB
    const newFile = await fileModel.create({
      title,
      fileBuffer,
      termsAgreed,
      article: file.originalname,
      fileType: file.mimetype,
      documentOwner: req.student.id,
      createdAt: new Date(),
    });

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

const getAllFiles = asyncHandler(async (req, res) => {
  try {
    // Extracting query parameters
    const { count, perPage } = req.query;

    // Parsing count and perPage as integers with default values
    const parsedCount = parseInt(count) || 0;
    const parsedPerPage = parseInt(perPage) || 10; // Defaulting to 10 documents per page

    // Constructing query
    const query = fileModel.find().select("-fileType");
    // Counting
    const totalDocuments = await fileModel.countDocuments();
    // Pagination
    const totalPages = Math.ceil(totalDocuments / parsedPerPage);
    const currentPage = Math.min(
      Math.ceil(parsedCount / parsedPerPage),
      totalPages
    );
    let startIndex = (currentPage - 1) * parsedPerPage;

    // Ensure startIndex is non-negative
    if (startIndex < 0) {
      startIndex = 0;
    }

    query.limit(parsedPerPage).skip(startIndex);

    // Executing query
    const files = await query.exec();

    res.status(200).json({
      success: true,
      data: files,
      currentPage,
      totalPages,
      totalDocuments,
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
  const { fileIds } = req.body; // Extract fileIds from request body
  console.log("fileIds:", fileIds);
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
    const fileName = file.fileName;
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
  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  // Set response headers for zip file download
  res.set({
    "Content-Type": "application/zip",
    "Content-Disposition": "attachment; filename=files.zip",
  });

  // Send zip file data as response
  res.send({
    zip: zipBuffer,
  });
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
const updateFile = upload.array("files", 3);
const updateFileInMongoDB = asyncHandler(async (req, resp) => {
  const { title, termsAgreed } = req.body; // Get title and termsAgreed from the request body
  const { fileId } = req.params;
  const fileIdObj = new mongoose.Types.ObjectId(fileId);

  console.log("req.files:", req.files);

  if (!req.files || req.files.length === 0) {
    resp.status(400);
    throw new Error("No files uploaded");
  }

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

  // Handle file update if a new file is uploaded
  for (let i = 0; i < req.files.length; i++) {
    const file = req.files[i];

    // Process each file
    file.originalname = Buffer.from(file.originalname, "latin1").toString(
      "utf-8"
    );

    const fileBuffer = file.buffer; // File data in memory

    // Update the file data if a new file is uploaded
    existingFile.fileBuffer = fileBuffer;
    existingFile.article = file.originalname;
    existingFile.fileType = file.mimetype;
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
    return res.status(404).json({ status: "fail", message: "File not found" });
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
  uploadFile,
  uploadFileToMongoDB,
  getAllFiles,
  downloadFileFromMongoDB,
  deleteFileFromMongoDB,
  updateFileInMongoDB,
  updateFileStatus,
  updateFile,
};
