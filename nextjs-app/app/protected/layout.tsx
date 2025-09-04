import { ThemeSwitcher } from "@/components/theme-switcher";
import  Nav from "@/components/custom-nav";
import UploadHistory from "../../components/upload-history";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-[5px] items-center">
        <Nav />
        <div className="flex-1 flex flex-col gap-20 max-w-6xl p-6">
          {children}
        </div>
        <footer className="w-full flex items-center justify-center gap-x-10 border-t border-t-foreground/20 mx-auto text-center text-xs py-4">
          <ThemeSwitcher />
          <UploadHistory />
        </footer>
      </div>
    </main>
  );
}
