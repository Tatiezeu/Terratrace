import { Check, Clock, AlertTriangle } from "lucide-react";
import { cn } from "../ui/utils";

export function TransferStatusPipeline({ status }) {
  const steps = [
    { key: "initiated", label: "Initiated" },
    { key: "notary_verified", label: "Notary Verified" },
    { key: "site_visit", label: "LRO Site Visit" },
    { key: "published", label: "30-Day Publication" },
    { key: "completed", label: "Titre Foncier Issued" },
  ];

  const statusOrder = ["initiated", "notary_verified", "site_visit", "published", "completed"];
  const currentIndex = statusOrder.indexOf(status);

  if (status === "disputed") {
    return (
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-500" />
          </div>
          <div>
            <p className="font-semibold text-red-900 dark:text-red-400">
              Opposition Detected - Transfer Blocked
            </p>
            <p className="text-sm text-red-700 dark:text-red-500">
              Status: Pending/Lawsuit. Transfer cannot proceed until dispute is resolved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h4 className="font-semibold text-foreground mb-4">Transfer Progress</h4>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepIndex = statusOrder.indexOf(step.key);
          const isCompleted = stepIndex < currentIndex;
          const isCurrent = stepIndex === currentIndex;
          const isPending = stepIndex > currentIndex;

          return (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all",
                    isCompleted &&
                      "bg-[var(--terra-emerald)] text-white ring-4 ring-emerald-100 dark:ring-emerald-900/30",
                    isCurrent &&
                      "bg-blue-500 text-white ring-4 ring-blue-100 dark:ring-blue-900/30 animate-pulse",
                    isPending && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : isCurrent ? (
                    <Clock className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <p
                  className={cn(
                    "text-xs mt-2 text-center font-medium",
                    (isCompleted || isCurrent) && "text-foreground",
                    isPending && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-2 transition-colors",
                    isCompleted ? "bg-[var(--terra-emerald)]" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
