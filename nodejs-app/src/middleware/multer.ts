import multer from "multer";
import path from "path";
import fs from "fs";

// Temporary upload directory
const TEMP_DIR = path.resolve(__dirname, "../../temp-uploads");

// Ensure the directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, TEMP_DIR);
  },
  filename: function (_req, file, cb) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1e6);
    const ext = path.extname(file.originalname);
    cb(null, `upload-${timestamp}-${random}${ext}`);
  },
});

// CSV-only file filter
const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
    cb(null, true);
  } else {
    cb(new Error("Only CSV files are allowed"));
  }
};

// Final multer instance
const multerInstance = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export default multerInstance;