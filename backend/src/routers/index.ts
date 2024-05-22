import express from "express";

import multer from "multer";
import uploadControllers from "../controllers/uploadControllers";

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("file"), uploadControllers.uploadFile);

router.get("/file/:id", uploadControllers.getFileById);

router.delete("/file/:id", uploadControllers.deleteFile);

router.get("/files", uploadControllers.getFilesName);

export default router;
