import { ChevronRight } from "lucide-react";

import { cx } from "../../lib/format.js";

export function PrimaryAction({ children, icon: Icon = ChevronRight, onClick, variant = "primary" }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left text-base font-semibold shadow-sm",
        variant === "primary"
          ? "bg-[#082B5C] text-white shadow-[0_12px_28px_rgba(8,43,92,0.24)]"
          : "border border-[#BFD1EA] bg-white text-[#082B5C]"
      )}
    >
      <span>{children}</span>
      <Icon className="h-5 w-5" />
    </button>
  );
}
