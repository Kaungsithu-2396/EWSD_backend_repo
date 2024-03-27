const asyncHandler = require("express-async-handler");
const academicYearModel = require("../Models/academicYearModel");
// @desc create AcademicYear
//@Route POST /api/v1/createAcademicYear
//@access private (Admin only)
const createAcademicYear = asyncHandler(async (req, resp) => {
    const { year } = req.body;
    if (!year) {
        resp.status(400);
        throw new Error("year must be provided");
    }
    const newAccYear = await academicYearModel.create({ year });
    resp.status(201).send({
        status: "success",
        year: newAccYear,
    });
});
// @desc getAllacademicYear
//@Route GET /api/v1/getAllacademicYear
//@access private (Admin only)
const getAllacademicYear = asyncHandler(async (req, resp) => {
    const allAcademicYear = await academicYearModel.find();
    resp.status(200).send({
        status: "success",
        count: allAcademicYear.length,
        year: allAcademicYear,
    });
});
module.exports = {
    createAcademicYear,
    getAllacademicYear,
};
