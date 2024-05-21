"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const stream_1 = require("stream");
const csv_parser_1 = __importDefault(require("csv-parser"));
// import router from "./routers";
const corsConfig_1 = require("./configs/corsConfig");
const dbConfig_1 = __importDefault(require("./db/dbConfig"));
const uploadedFile_1 = __importDefault(require("./models/uploadedFile"));
const slugify_1 = __importDefault(require("slugify"));
const short_unique_id_1 = __importDefault(require("short-unique-id"));
const moment_1 = __importDefault(require("moment"));
const uid = new short_unique_id_1.default({ length: 4 });
dotenv_1.default.config();
const PORT = process.env.PORT || "8000";
const app = (0, express_1.default)();
app.set("port", PORT);
app.use(express_1.default.json({ limit: "10kb" }));
app.use((0, cors_1.default)(corsConfig_1.corsOptions));
app.use((0, morgan_1.default)("dev"));
app.use((0, cookie_parser_1.default)());
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
(0, dbConfig_1.default)();
app.get("/", (_, res) => {
    return res.status(200).json({ msg: "Sucessfully running" });
});
app.post("/upload", upload.single("file"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send("No file uploaded.");
        }
        if (!req.file.originalname.endsWith(".csv")) {
            return res.status(400).send("Only CSV file is allowed.");
        }
        const fileInfo = {
            filename: req.file.originalname,
            path: req.file.path,
            uploadDate: new Date(),
        };
        if (!fileInfo) {
            return res.status(404).send("File not found.");
        }
        const data = [];
        const readableFileStream = new stream_1.Readable();
        readableFileStream.push(req.file.buffer);
        readableFileStream.push(null);
        readableFileStream
            .pipe((0, csv_parser_1.default)())
            .on("data", (row) => {
            data.push(row);
        })
            .on("end", () => __awaiter(void 0, void 0, void 0, function* () {
            let newSlug = (0, slugify_1.default)(fileInfo.filename.split(".csv")[0]);
            const check = uploadedFile_1.default.findOne({ slug: newSlug });
            if (check) {
                newSlug = newSlug + "-" + uid.rnd();
            }
            const allData = new uploadedFile_1.default({
                fileName: fileInfo.filename,
                data: { columns: Object.keys(data[0]), rows: data },
                slug: newSlug,
            });
            yield allData.save();
            return res.json({
                fileName: allData.fileName,
                id: allData.slug,
                rows: allData.data.rows.length,
                uploadedAt: (0, moment_1.default)(allData.createdAt).format("DD-MM-YYYY"),
            });
        }));
    }
    catch (error) {
        if (error instanceof Error) {
            console.log(`Error: ${error.message}`);
            return res.status(500).json({ error: "Something went wrong!" });
        }
    }
});
app.get("/file/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "Please provide an ID" });
        }
        const fileData = yield uploadedFile_1.default.findOne({ slug: id });
        if (!fileData) {
            return res.status(400).json({ error: "No file found" });
        }
        return res.status(200).json({
            fileName: fileData.fileName,
            id: fileData.slug,
            data: fileData.data,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            console.log(`Error: ${error.message}`);
            return res.status(500).json({ error: "Something went wrong!" });
        }
    }
}));
app.delete("/file/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "Please provide an ID" });
        }
        const deletedItem = yield uploadedFile_1.default.findOneAndDelete({ slug: id });
        if (!deletedItem) {
            return res.status(400).json({ error: "No such file found!" });
        }
        return res.status(200).json({ msg: "File deleted successfully!" });
    }
    catch (error) {
        if (error instanceof Error) {
            console.log(`Error: ${error.message}`);
            return res.status(500).json({ error: "Something went wrong!" });
        }
    }
}));
app.get("/files", (_, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield uploadedFile_1.default.find({});
        const result = [];
        console.log("data", data);
        for (let item of data) {
            const newObj = {
                fileName: item.fileName,
                id: item.slug,
                uploadedAt: (0, moment_1.default)(item.createdAt).format("DD-MM-YYYY"),
                rows: item.data.rows.length,
            };
            result.push(newObj);
        }
        return res.status(200).json(result);
    }
    catch (error) {
        if (error instanceof Error) {
            console.log(`Error: ${error.message}`);
            return res.status(500).json({ error: "Something went wrong!" });
        }
    }
}));
// app.use("/api/v1", router);
app.listen(parseInt(PORT, 10), `0.0.0.0`, () => {
    console.log(`Server is running on PORT: ${PORT}`);
});
//# sourceMappingURL=index.js.map