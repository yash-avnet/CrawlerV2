"use client";

import { useState, useRef, FormEvent, useCallback } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";

export function CsvUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setMessage("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    multiple: false,
    maxFiles: 1,
  });

  const handleRemoveFile = () => {
    setFile(null);
    setMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    setMessage(`Uploading "${file.name}"...`);

    const formData = new FormData();
    formData.append("file", file);

    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

    try {
      const res = await axios.post(`${BASE_URL}/start-crawl`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage(res.data.message || "Crawl started successfully.");
      setFile(null); // Clear the file after successful upload
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      setMessage(`Upload failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="border p-7 rounded-lg shadow-sm bg-card w-[450px] h-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-md font-medium mb-2">
            Upload CSV File
          </label>

          {!file ? (
            <div
              {...getRootProps()}
              className={`p-8 border-2 border-dashed rounded-md cursor-pointer transition-colors ${isDragActive ? "border-green-500" : "border-border"
                } bg-background`}
            >
              <input {...getInputProps()} />
              <p className="text-sm text-center text-muted-foreground">
                Drag and drop a CSV file here, or click to select
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 border rounded-md bg-background">
              <span className="text-lg truncate font-medium">{file.name}</span>
              <button
                type="button"
                onClick={handleRemoveFile}
                disabled={isUploading}
                className="ml-4 text-lg font-semibold text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!file || isUploading}
          className="w-full px-4 py-2 bg-foreground text-background font-semibold rounded-lg shadow-md hover:bg-foreground/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? "Uploading..." : "Upload and Start Crawl"}
        </button>
      </form>

      {message && (
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
