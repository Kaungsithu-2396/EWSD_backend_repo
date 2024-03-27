const mongoose = require("mongoose");
const academicSchema = new mongoose.Schema(
    {
        year: {
            type: Number,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);
const academicYearModel = mongoose.model("academicYear", academicSchema);
module.exports = academicYearModel;
