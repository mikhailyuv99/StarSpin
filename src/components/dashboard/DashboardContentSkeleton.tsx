import { ui } from "@/components/ui/styles";

export function DashboardContentSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-hidden>
      <div className="space-y-2">
        <div className="h-8 w-48 rounded-lg bg-black/10" />
        <div className="h-4 w-72 max-w-full rounded bg-black/10" />
      </div>
      <div className={`${ui.card} h-40`} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={`${ui.card} h-28`} />
        <div className={`${ui.card} h-28`} />
      </div>
    </div>
  );
}
