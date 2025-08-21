import Image from 'next/image';
import Link from "next/link";
import { hasEnvVars } from "@/lib/utils";
import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";

function Nav() {
  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/20">
      <div className="w-full max-w-5xl flex justify-between items-center px-5 py-2 text-sm">
        <div className="flex flex-col font-serif font-bold text-lg items-center">
          <Link href="/">
            <Image
              src="/avnet.png"
              alt="Company Logo"
              width={120}
              height={30}
            />
          </Link>
          <div>
            Crawler App
          </div>
        </div>
        <div>
          {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
        </div>
      </div>
    </nav>
  )
}

export default Nav