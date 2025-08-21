import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const supabase = await createClient();

  // You can also use getUser() which will be slower.
  const { data } = await supabase.auth.getClaims();

  const user = data?.claims;

  return user ? (
    <div className="flex items-center gap-4 [&>*]:text-lg">
      <p>Hey, {user?.user_metadata?.full_name}!</p>
      <Button variant={"outline"} className="border-[#545454]">
        <Link href="/protected">Go to Crawler</Link>
      </Button>
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button className="p-5 text-lg border-[#8f8f8f]" asChild size="sm" variant={"outline"}>
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button className="p-5 text-lg" asChild size="sm" variant={"default"}>
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
