"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
// Schema for UploadedFile document
const UploadedFileSchema = new mongoose_1.Schema({
    fileName: { type: String, required: true, trim: true },
    data: { type: Object, required: true },
    slug: { type: String, required: true, unique: true },
}, { timestamps: true });
// Model for UploadedFile document
const UploadedFile = (0, mongoose_1.model)("UploadedFile", UploadedFileSchema);
exports.default = UploadedFile;
//# sourceMappingURL=uploadedFile.js.map