const express = require("express");
const dateSettingRouter = express.Router();
const verifiedAuthorizedUser = require("../middleware/authMiddleware");
const verifyAdmin = require("../middleware/verifyAdmin");
const {
  createDateSetting,
  getAllDates,
  updateDates,
  deleteDates,
} = require("../controllers/dateSettingController");
dateSettingRouter
  .route("/createDateSetting")
  .post(verifiedAuthorizedUser, verifyAdmin, createDateSetting);
dateSettingRouter.route("/dates").get(verifiedAuthorizedUser, getAllDates);
dateSettingRouter
  .route("/:id")
  .put(verifiedAuthorizedUser, verifyAdmin, updateDates)
  .delete(verifiedAuthorizedUser, verifyAdmin, deleteDates);
module.exports = dateSettingRouter;
