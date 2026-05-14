import { Loader2 } from "lucide-react";

export const SpinnerLoader = ({ className = "" }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className="w-8 h-8 text-[var(--terra-emerald)] animate-spin" />
    </div>
  );
};
