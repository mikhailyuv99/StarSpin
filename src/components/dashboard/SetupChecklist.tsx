import Link from "next/link";
import { ui } from "@/components/ui/styles";
import type { SetupStep } from "@/lib/merchant-setup";

export function SetupChecklist({
  steps,
  doneCount,
  total,
  complete,
  labels,
}: {
  steps: SetupStep[];
  doneCount: number;
  total: number;
  complete: boolean;
  labels: {
    title: string;
    subtitle: string;
    completeTitle: string;
    completeBody: string;
    stepSubscribe: string;
    stepJourney: string;
    stepPrizes: string;
    stepQr: string;
    stepTest: string;
    progress: string;
    open: string;
    done: string;
  };
}) {
  const stepLabel: Record<SetupStep["id"], string> = {
    subscribe: labels.stepSubscribe,
    journey: labels.stepJourney,
    prizes: labels.stepPrizes,
    qr: labels.stepQr,
    test: labels.stepTest,
  };

  return (
    <section className={`${ui.card} space-y-4`}>
      <div>
        <h2 className={ui.h2}>{complete ? labels.completeTitle : labels.title}</h2>
        <p className={`mt-1 ${ui.muted}`}>{complete ? labels.completeBody : labels.subtitle}</p>
        {!complete && (
          <p className="mt-2 text-xs font-extrabold uppercase tracking-wide text-muted">
            {labels.progress.replace("{done}", String(doneCount)).replace("{total}", String(total))}
          </p>
        )}
      </div>

      <ol className="space-y-2">
        {steps.map((step, index) => (
          <li key={step.id}>
            <Link
              href={step.href}
              target={step.id === "test" ? "_blank" : undefined}
              rel={step.id === "test" ? "noopener noreferrer" : undefined}
              className="flex items-center gap-3 rounded-[14px] border-2 border-black bg-white px-4 py-3 transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#0a0a0a]"
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-black text-sm font-extrabold ${
                  step.done ? "bg-[var(--c-mint)]" : "bg-[var(--c-cream)]"
                }`}
                aria-hidden
              >
                {step.done ? "✓" : index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold text-ink">{stepLabel[step.id]}</span>
                <span className="block text-xs font-medium text-muted">
                  {step.done ? labels.done : labels.open}
                </span>
              </span>
              <span className="shrink-0 text-sm font-bold text-muted" aria-hidden>
                →
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
