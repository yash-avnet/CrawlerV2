"use client";

import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { RefreshCcw } from 'lucide-react';

type Batch = {
  id: string;
  request_name: string;
  file_name: string;
  status: string;
  created_at: string;
  uploaded_at: string | null;
  completed_at: string | null;
  total_mpns: number;
  success_count: number;
  failed_count: number;
  skipped_count: number;
};

const PAGE_SIZE = 10;

export default function BatchesPage() {
  const supabase = createClient();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  function getStatusClass(status: string) {
    switch (status) {
      case "pending":
        return "bg-neutral-700 text-white px-2 py-1 text-sm rounded-md";
      case "in_progress":
        return "bg-blue-800 text-blue-100 px-2 py-1 text-sm rounded-md";
      case "completed":
        return "bg-[#085404] text-green-200 px-2 py-1 text-sm rounded-md";
      case "failed":
        return "bg-[#610808] text-red-200 px-2 py-1 text-sm rounded-md";
      default:
        return "";
    }
  }

  async function fetchBatches(page = currentPage, query = searchQuery) {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let supabaseQuery = supabase
      .from("crawl_batches")
      .select("*", { count: "exact" })
      .order("uploaded_at", { ascending: false })
      .range(from, to)
      .eq("created_by", user?.id);

    if (query.trim() !== "") {
      supabaseQuery = supabaseQuery.ilike("request_name", `%${query.trim()}%`);
    }

    const { data, error, count } = await supabaseQuery;

    if (error) {
      console.error("❌ Supabase fetch error:", error.message);
    } else {
      setBatches(data || []);
      if (count) setTotalPages(Math.ceil(count / PAGE_SIZE));
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchBatches();
  }, [currentPage]);

  const refreshFn = () => {
    fetchBatches();
  }

  return (
    <div className="w-full p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Upload History and Status</h1>
          <button onClick={refreshFn}>
            <RefreshCcw className="mt-1 text-neutral-400 hover:text-neutral-100" />
          </button>
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search Request Name"
              className="border border-neutral-700 px-3 py-1 rounded pr-8 w-full bg-inherit"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2  text-2xl pb-1 text-neutral-400 hover:text-neutral-100"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                  fetchBatches(1, "");
                }}
              >
                &times;
              </button>
            )}
          </div>
          <Button
            onClick={() => {
              setCurrentPage(1);
              fetchBatches(1, searchQuery);
            }}
          >
            <p className="text-base">Search</p>
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto border border-neutral-700">
        <table className="w-full">
          <thead>
            <tr className="whitespace-nowrap text-lg">
              <th className="border px-4 py-2">Request Name</th>
              <th className="border px-4 py-2">File Name</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Uploaded At</th>
              <th className="border px-4 py-2">Completed At</th>
              <th className="border px-4 py-2">Total</th>
              <th className="border px-4 py-2">Success</th>
              <th className="border px-4 py-2">Failed</th>
              <th className="border px-4 py-2">Skipped</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-4">
                  Loading...
                </td>
              </tr>
            ) : batches.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-4">
                  No uploads yet
                </td>
              </tr>
            ) : (
              batches.map((batch) => (
                <tr key={batch.id}>
                  <td className="border px-2 py-1">{batch.request_name}</td>
                  <td className="border px-2 py-1">{batch.file_name}</td>
                  <td className="border px-2 py-1 text-center">
                    <span className={getStatusClass(batch.status)}>
                      {batch.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="border px-2 py-1">
                    {batch.uploaded_at
                      ? new Date(batch.uploaded_at).toLocaleString()
                      : "-"}
                  </td>
                  <td className="border px-2 py-1">
                    {batch.completed_at
                      ? new Date(batch.completed_at).toLocaleString()
                      : "-"}
                  </td>
                  <td className="border px-2 py-1">{batch.total_mpns}</td>
                  <td className="border px-2 py-1">{batch.success_count}</td>
                  <td className="border px-2 py-1">{batch.failed_count}</td>
                  <td className="border px-2 py-1">{batch.skipped_count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center mt-4 gap-4">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border border-[#545454] rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>
          Page <strong className="px-1 mx-0.5 border border-neutral-600 bg-muted">{currentPage}</strong> of {totalPages}
        </span>
        <button
          onClick={() =>
            setCurrentPage((p) => Math.min(totalPages, p + 1))
          }
          disabled={currentPage === totalPages}
          className="px-3 py-1 border border-[#545454] rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}