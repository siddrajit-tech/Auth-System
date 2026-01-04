import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { connectDb } from "./config/db.js";
import authRoutes from "./routes/authRoute.js";

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());

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
