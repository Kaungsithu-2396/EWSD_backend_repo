const express = require("express");
const academicRouter = express.Router();
const verifiedAuthorizedUser = require("../middleware/authMiddleware");
const verifyAdmin = require("../middleware/verifyAdmin");
const {
  createAcademicYear,
  getAllacademicYear,
} = require("../controllers/academicController");
academicRouter
  .route("/createAcademicYear")
  .post(verifiedAuthorizedUser, verifyAdmin, createAcademicYear);
academicRouter.route("/getAllacademicYear").get(getAllacademicYear);
module.exports = academicRouter;
