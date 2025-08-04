import express from "express";
import cors from 'cors';
import dotenv from "dotenv";
import startCrawlRouter from "./api/start-crawl";
import statusRouter from "./api/status";
// import resultsRouter from "./api/results";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(cors());

// API Routes
app.use("/api/start-crawl", startCrawlRouter);
app.use("/api/status", statusRouter);
// app.use("/api/results", resultsRouter);

app.listen(PORT, () => {
  console.log(`Server is running at PORT: ${PORT}`);
});
