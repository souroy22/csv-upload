import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";
import routers from "./routers";
import { corsOptions } from "./configs/corsConfig";
import connectDB from "./db/dbConfig";

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

connectDB();

app.get("/", (_: Request, res: Response) => {
  return res.status(200).json({ msg: "Sucessfully running" });
});

app.use("/api/v1", routers);

app.listen(parseInt(PORT, 10), `0.0.0.0`, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});
