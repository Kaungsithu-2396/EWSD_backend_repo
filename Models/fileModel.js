const mongoose = require("mongoose");
const { Schema } = mongoose;
const FileSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        article: {
            type: String,
            required: false,
          },
        fileBuffer: {
            type: Buffer,
            required: false,
          },
        fileType: {
            type: String,
            required: false,
          },
        createdAt: {
            type: Date,
            default: Date.now,
            required: false,
          },
          updatedAt: {
            type: Date,
            default: Date.now,
            required: false,
          },
        documentOwner: {
            type: String,
            require: false,
          },
        status: {
            type: String,
            enum: ['submitted', 'approved', 'edited'],
            default: 'submitted',
          },
        termsAgreed: {
            type: Boolean,
            required: true,
            default: false,
          },
    }

);
const File = mongoose.models.File || mongoose.model("File", FileSchema);

module.exports = File;