const facultyModel = require("../Models/facultyModel");
const asyncHandler = require("express-async-handler");
//@desc createFaculty
//@Route POST /api/v1/faculty/createFaculty
//@access PRIVATE (Admin only access)
const createFaculty = asyncHandler(async (req, resp) => {
    const { name } = req.body;
    if (!name) {
        resp.status(400);
        throw new Error("please provide the faculty name");
    }
    const newFacultyName = await facultyModel.create({ name });
    resp.status(201).send({
        status: "success",
        faculty: newFacultyName,
    });
});
//@desc getAllFaculties
//@Route GET /api/v1/faculty/getAllFaculties
//@access PRIVATE (Admin only access)
const getAllFaculties = asyncHandler(async (req, resp) => {
    const allFaculties = await facultyModel.find();
    resp.status(200).send({
        count: allFaculties.length,
        faculty: allFaculties,
    });
});
//@desc delete faculty
//@Route DELETE /api/v1/faculty/:id
//@access PRIVATE (Admin only access)
const deleteFaculty = asyncHandler(async (req, resp) => {
    const { id } = req.params;
    if (!id) {
        resp.status(400);
        throw new Error("no id is provided");
    }
    const isValidIdx = await facultyModel.findById(id);
    if (!isValidIdx) {
        resp.status(400);
        throw new Error("No item found with this id");
    }
    await facultyModel.findByIdAndDelete(id);
    resp.status(200).send({
        message: "delete success",
    });
});
//@desc update faculty
//@Route PUT /api/v1/faculty/:id
//@access PRIVATE (Admin only access)
const updateFaculty = asyncHandler(async (req, resp) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!id) {
        resp.status(400);
        throw new Error("no id is provided");
    }
    const isValidIdx = await facultyModel.findById(id);
    if (!isValidIdx) {
        resp.status(400);
        throw new Error("none of the item exisits with this id");
    }
    const updatedFaculty = await facultyModel.findByIdAndUpdate(
        id,
        { name },
        {
            new: true,
        }
    );
    resp.status(200).send({
        status: "success",
        faculty: updatedFaculty,
    });
});
module.exports = {
    createFaculty,
    getAllFaculties,
    deleteFaculty,
    updateFaculty,
};
