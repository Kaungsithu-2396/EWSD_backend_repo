const mongoose = require("mongoose");
const facultySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
    },
    {
        timestamps: true,
    }
);
const facultyModel = mongoose.model("faculty", facultySchema);
module.exports = facultyModel;
