"use client";

import { useState, useRef, FormEvent, useCallback } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import { createClient } from "../lib/supabase/client"; // ✅ not server.ts

export function CsvUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("GBP");
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

    if (!name.trim()) {
      setMessage("Please enter a name.");
      return;
    }

    if (!file) {
      setMessage("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    setMessage(`Uploading "${file.name}"...`);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name);
    formData.append("currency", currency);

    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

    try {
      const supabase = createClient();

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        setMessage("You must be logged in to upload.");
        return;
      }

      const res = await axios.post(`${BASE_URL}/start-crawl`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      setMessage(res.data.message || "Crawl started successfully.");

      setFile(null);
      setName("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      setMessage(`Upload failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setMessage("")
      }, 10 * 1000);
    }
  };

  return (
    <div className="border border-[#414141] p-7 rounded-lg shadow-sm w-[500px] h-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-[2fr,1fr] gap-4">
          <div>
            <label className="block text-md font-medium mb-2">Request Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name"
              className="w-full px-3 py-2 border border-neutral-700 rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isUploading}
              required
            />
          </div>

          <div>
            <label className="block text-md font-medium mb-2">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              disabled={isUploading}
              className="w-full px-2 py-2 border border-neutral-700 rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              required
            >
              <option value="GBP">GBP</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-md font-medium mb-2">
            Upload CSV File
          </label>

          {!file ? (
            <div
              {...getRootProps()}
              className={`p-8 border-2 border-dashed rounded-md cursor-pointer transition-colors ${isDragActive ? "border-green-500" : "border-neutral-700"
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

        <div className="flex items-center justify-center">
          <button
            type="submit"
            disabled={!file || isUploading || !name.trim()}
            className="w-3/5 px-4 py-2 bg-foreground text-background font-semibold rounded-lg shadow-md hover:bg-foreground/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? "Uploading..." : "Upload and Start Crawl"}
          </button>
        </div>
      </form>

      {message && (
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
