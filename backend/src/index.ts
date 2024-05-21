import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";
import multer from "multer";
import { Readable } from "stream";
import csv from "csv-parser";
// import router from "./routers";
import { corsOptions } from "./configs/corsConfig";
import connectDB from "./db/dbConfig";
import UploadedFile from "./models/uploadedFile";
import slugify from "slugify";
import ShortUniqueId from "short-unique-id";
import moment from "moment";

const uid = new ShortUniqueId({ length: 4 });

dotenv.config();
const PORT = process.env.PORT || "8000";
const app = express();
app.set("port", PORT);

declare global {
  namespace Express {
    interface Request {
      user: Record<string, any>;
      token: string | null;
    }
  }
}

app.use(express.json({ limit: "10kb" }));
app.use(cors(corsOptions));
app.use(morgan("dev"));
app.use(cookieParser());

const upload = multer({ storage: multer.memoryStorage() });
connectDB();

app.get("/", (_: Request, res: Response) => {
  return res.status(200).json({ msg: "Sucessfully running" });
});

app.post("/upload", upload.single("file"), (req: Request, res: Response) => {
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

    const data: any = [];
    const readableFileStream = new Readable();
    readableFileStream.push(req.file.buffer);
    readableFileStream.push(null);
    readableFileStream
      .pipe(csv())
      .on("data", (row) => {
        data.push(row);
      })
      .on("end", async () => {
        let newSlug = slugify(fileInfo.filename.split(".csv")[0]);
        const check = UploadedFile.findOne({ slug: newSlug });
        if (check) {
          newSlug = newSlug + "-" + uid.rnd();
        }
        const allData = new UploadedFile({
          fileName: fileInfo.filename,
          data: { columns: Object.keys(data[0]), rows: data },
          slug: newSlug,
        });
        await allData.save();
        return res.json({
          fileName: allData.fileName,
          id: allData.slug,
          rows: allData.data.rows.length,
          uploadedAt: moment(allData.createdAt).format("DD-MM-YYYY"),
        });
      });
  } catch (error) {
    if (error instanceof Error) {
      console.log(`Error: ${error.message}`);
      return res.status(500).json({ error: "Something went wrong!" });
    }
  }
});

app.get("/file/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Please provide an ID" });
    }
    const fileData = await UploadedFile.findOne({ slug: id });
    if (!fileData) {
      return res.status(400).json({ error: "No file found" });
    }
    return res.status(200).json({
      fileName: fileData.fileName,
      id: fileData.slug,
      data: fileData.data,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.log(`Error: ${error.message}`);
      return res.status(500).json({ error: "Something went wrong!" });
    }
  }
});

app.delete("/file/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Please provide an ID" });
    }
    const deletedItem = await UploadedFile.findOneAndDelete({ slug: id });
    if (!deletedItem) {
      return res.status(400).json({ error: "No such file found!" });
    }
    return res.status(200).json({ msg: "File deleted successfully!" });
  } catch (error) {
    if (error instanceof Error) {
      console.log(`Error: ${error.message}`);
      return res.status(500).json({ error: "Something went wrong!" });
    }
  }
});

app.get("/files", async (_: Request, res: Response) => {
  try {
    const data = await UploadedFile.find({});
    const result = [];
    console.log("data", data);
    for (let item of data) {
      const newObj = {
        fileName: item.fileName,
        id: item.slug,
        uploadedAt: moment(item.createdAt).format("DD-MM-YYYY"),
        rows: item.data.rows.length,
      };
      result.push(newObj);
    }
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      console.log(`Error: ${error.message}`);
      return res.status(500).json({ error: "Something went wrong!" });
    }
  }
});

// app.use("/api/v1", router);

app.listen(parseInt(PORT, 10), `0.0.0.0`, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});
