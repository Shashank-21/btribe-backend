import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import morgan from "morgan";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import courseRoutes from "./routes/course.js";
import variantRoutes from "./routes/variant.js";
import slotRoutes from "./routes/slot.js";

dotenv.config();
const app = express();
//iSUgSAsZhEpmyhCo

mongoose
  .connect(process.env.MONGO_DB_URI)
  .then(() => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.log(err);
  });

//middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

//router middleware
app.use("/api", authRoutes);
app.use("/api", courseRoutes);
app.use("/api", variantRoutes);
app.use("/api", slotRoutes);

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`Node is running on server ${port}`);
});
