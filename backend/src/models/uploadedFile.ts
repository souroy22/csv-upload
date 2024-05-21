import { Schema, SchemaTypeOptions, model } from "mongoose";

type DATA_TYPE = {
  rows: any[];
  columns: any[];
};

// Interface for UploadedFile document
export interface IUploadedFile extends Document {
  fileName: string;
  slug: string;
  data: DATA_TYPE;
  createdAt: Date;
  updateAt: Date;
}

// Schema for UploadedFile document
const UploadedFileSchema = new Schema<IUploadedFile>(
  {
    fileName: { type: String, required: true, trim: true },
    data: { type: Object, required: true },
    slug: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

// Model for UploadedFile document
const UploadedFile = model<IUploadedFile>("UploadedFile", UploadedFileSchema);

export default UploadedFile;
