"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const UploadHistory = () => {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      className="text-muted-foreground border-[#545454] rounded-lg select-none"
      onClick={() => router.push("/protected/history-status")}
    >
      View upload history and status
    </Button>
  );
};

export default UploadHistory;