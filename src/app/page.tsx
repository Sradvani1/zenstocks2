import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center px-6 py-12">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight">ZenStocks</h1>
        <p className="text-lg text-muted-foreground">
          Track your portfolio, read daily AI-curated news, and chat with a portfolio-aware analyst.
        </p>
        <p className="text-sm text-muted-foreground">
          Sign in and holdings management arrive in Phase 2.
        </p>
      </div>
      <div className="mt-10 flex flex-col gap-3">
        <Link
          href="/folio"
          className={cn(buttonVariants({ size: "lg" }), "min-h-11 w-full")}
        >
          Preview app shell
        </Link>
      </div>
    </div>
  );
}
