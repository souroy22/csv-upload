import express from "express";
import multer from "multer";
import uploadControllers from "../controllers/uploadControllers";

const routers = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

routers.get("/files", uploadControllers.getFilesName);

routers.post("/upload", upload.single("file"), uploadControllers.uploadFile);

routers.get("/file/:id", uploadControllers.getFileById);

routers.delete("/file/:id", uploadControllers.deleteFile);

export default routers;
