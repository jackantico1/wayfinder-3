import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface VibeChipProps {
  label: string;
  icon: LucideIcon;
  selected: boolean;
  onClick: () => void;
}

export default function VibeChip({ label, icon: Icon, selected, onClick }: VibeChipProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
        selected
          ? "border-fuchsia-400/60 bg-fuchsia-500/20 text-fuchsia-100 shadow-[0_0_20px_-5px_rgba(217,70,239,0.6)]"
          : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:text-white/90"
      }`}
    >
      <Icon size={16} strokeWidth={2} />
      {label}
    </motion.button>
  );
}
