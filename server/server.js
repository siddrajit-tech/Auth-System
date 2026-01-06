import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cookieParser from "cookie-parser";
import { connectDb } from "./config/db.js";
import authRoutes from "./routes/authRoute.js";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhos:3000",
    credentials: true,
  })
);

// Routes
app.use("/auth", authRoutes);

// Server
async function startServer() {
  await connectDb();
  app.listen(PORT, () => {
    console.log("Server started on PORT: ", PORT);
  });
}

startServer();
