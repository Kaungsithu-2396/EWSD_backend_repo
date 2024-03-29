const mongoose = require("mongoose");
const dateSettingSchema = new mongoose.Schema(
    {
        closureDate: {
            type: Date,
            required: true,
        },
        finalClosureDate: {
            type: Date,
            required: true,
        },
        academicYear: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "academicYear",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);
const dateSettingModel = mongoose.model("Dates", dateSettingSchema);
module.exports = dateSettingModel;
