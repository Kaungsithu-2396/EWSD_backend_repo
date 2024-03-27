const express = require("express");
const facultyRoutes = express.Router();
const {
    createFaculty,
    getAllFaculties,
    updateFaculty,
    deleteFaculty,
} = require("../controllers/facultyController");
facultyRoutes.route("/createFaculty").post(createFaculty);
facultyRoutes.route("/getAllFaculty").get(getAllFaculties);
facultyRoutes.route("/:id").delete(deleteFaculty).put(updateFaculty);
module.exports = facultyRoutes;
