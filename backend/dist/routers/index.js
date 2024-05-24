"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const uploadControllers_1 = __importDefault(require("../controllers/uploadControllers"));
const routers = express_1.default.Router();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
routers.get("/files", uploadControllers_1.default.getFilesName);
routers.post("/upload", upload.single("file"), uploadControllers_1.default.uploadFile);
routers.get("/file/:id", uploadControllers_1.default.getFileById);
routers.delete("/file/:id", uploadControllers_1.default.deleteFile);
exports.default = routers;
//# sourceMappingURL=index.js.map