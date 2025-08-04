import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CsvUploadForm } from "@/components/csv-upload-form";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center">
      <div className="w-full max-w-2xl px-6 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Crawler Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Upload a CSV file of part numbers to begin.
          </p>
        </div>
        <CsvUploadForm />
      </div>
    </div>
  );
}
