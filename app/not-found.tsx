import Link from "next/link";
import { CenteredPage } from "@/components/layout/CenteredPage";
import { buttonVariants } from "@/components/ui/button";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <CenteredPage>
      <div className="panel p-8">
        <p className="font-mono text-[13px] text-accent-text">404</p>
        <h1 className="mt-2 text-[26px] font-semibold leading-tight text-fg">This page isn&rsquo;t here</h1>
        <p className="mt-2 text-[14.5px] text-fg-muted">
          The link may be old, or the lead may have been deleted. Leads from another workspace also land here.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/dashboard" data-press="" className={buttonVariants({ variant: "primary" })}>
            Go to Today
          </Link>
          <Link href="/" data-press="" className={buttonVariants({ variant: "secondary" })}>
            Home page
          </Link>
        </div>
      </div>
    </CenteredPage>
  );
}
