import { cx } from "../../lib/format.js";

export function StatusBar({ dark = true }) {
  return (
    <div className={cx("flex items-center justify-between px-6 pt-4 text-sm font-semibold", dark ? "text-[#0a2342]" : "text-white")}>
      <span>9:41</span>
      <div className="flex items-center gap-2 text-[10px]">
        <div className="h-2 w-2 rounded-full bg-current opacity-80" />
        <div className="h-2 w-4 rounded-full border border-current opacity-70" />
        <div className="h-2 w-6 rounded-sm border border-current">
          <div className="h-full w-4 rounded-[2px] bg-current" />
        </div>
      </div>
    </div>
  );
}
