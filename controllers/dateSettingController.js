const asyncHandler = require("express-async-handler");
const dateSettingModel = require("../Models/dateSettingModel");
//@desc create closure and final closure date
//@Route POST /api/v1/dateSetting/createDateSetting
//@access PRIVATE (Admin only access)
const createDateSetting = asyncHandler(async (req, resp) => {
    const { closureDate, finalClosureDate, academicYear } = req.body;
    if (!closureDate || !finalClosureDate || !academicYear) {
        resp.status(400);
        throw new Error("provide the complete data");
    }
    const newDateSetting = await dateSettingModel.create({
        closureDate,
        finalClosureDate,
        academicYear,
    });
    resp.status(201).send({
        status: "success",
        date: newDateSetting,
    });
});
//@desc get all closure and final closure date
//@Route GET /api/v1/dateSetting/dates
//@access PRIVATE (Admin only access)
const getAllDates = asyncHandler(async (req, resp) => {
    const allDates = await dateSettingModel.find();
    resp.status(200).send({
        status: "suceess",
        count: allDates.length,
        date: allDates,
    });
});
//@desc delete closure and final closure date
//@Route DELETE /api/v1/dateSetting/:id
//@access PRIVATE (Admin only access)
const deleteDates = asyncHandler(async (req, resp) => {
    const { id } = req.params;
    if (!id) {
        resp.status(400);
        throw new Error("provide id");
    }
    const isValidIdx = await dateSettingModel.findById(id);
    if (!isValidIdx) {
        resp.status(400);
        throw new Error("Invalid id");
    }
    await dateSettingModel.findByIdAndDelete(id);
    resp.status(200).send({
        status: "success",
        message: "delete success",
    });
});
//@desc update closure and final closure date
//@Route PUT /api/v1/dateSetting/:id
//@access PRIVATE (Admin only access)
const updateDates = asyncHandler(async (req, resp) => {
    const { id } = req.params;
    const { closureDate, finalClosureDate, academicYear } = req.body;
    if (!id) {
        resp.status(400);
        throw new Error("Please provide id");
    }
    const isValidIdx = await dateSettingModel.findById(id);
    if (!isValidIdx) {
        resp.status(400);
        throw new Error("invalid id");
    }
    const updatedDate = await dateSettingModel.findByIdAndUpdate(
        id,
        {
            closureDate,
            finalClosureDate,
            academicYear,
        },
        {
            new: true,
        }
    );
    resp.status(200).send({
        status: "success",
        date: updatedDate,
    });
});
module.exports = {
    createDateSetting,
    updateDates,
    getAllDates,
    deleteDates,
};
