const mongoose = require("mongoose");
const { Schema } = mongoose;
const FileSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  article: {
    type: String,
    required: false,
  },
  fileBuffer: {
    type: String,
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
  commentId: {
    type: Schema.Types.ObjectId,
    ref: "Comment",
  },
  comments: {
    type: String,
    required: false,
  },
  documentOwner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  faculty: {
    type: Schema.Types.ObjectId,
    required: false,
  },
  status: {
    type: String,
    enum: ["submitted", "approved", "edited"],
    default: "submitted",
  },
  views: {
    type: Number,
    default: 0,
  },
  termsAgreed: {
    type: Boolean,
    required: true,
    default: false,
  },
});
const File = mongoose.models.File || mongoose.model("File", FileSchema);

module.exports = File;
