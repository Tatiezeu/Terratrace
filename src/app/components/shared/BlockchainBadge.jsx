import { Shield } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../ui/utils";

export function BlockchainBadge({ verified = true, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border-2",
        verified
          ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-700 dark:text-emerald-400"
          : "bg-gray-50 dark:bg-gray-950/20 border-gray-300 text-gray-700 dark:text-gray-400",
        className
      )}
    >
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3,
        }}
      >
        <Shield className="w-4 h-4" fill="currentColor" />
      </motion.div>
      <span className="text-xs font-semibold">
        {verified ? "Blockchain Verified" : "Pending Verification"}
      </span>
    </motion.div>
  );
}
