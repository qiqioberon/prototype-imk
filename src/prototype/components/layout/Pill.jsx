import { cx } from "../../lib/format.js";

export function Pill({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "grid min-h-[52px] min-w-0 place-items-center rounded-full border px-2.5 py-2 text-center text-[13px] font-semibold leading-tight transition",
        active ? "border-[#082B5C] bg-[#082B5C] text-white shadow-sm" : "border-[#082B5C] bg-white text-[#082B5C]"
      )}
    >
      {children}
    </button>
  );
}
