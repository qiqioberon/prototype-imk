import { cx } from "../../lib/format.js";

export function PreferenceChip({ active, label, description, icon: Icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "flex items-center gap-2 rounded-2xl border px-3 py-3 text-left transition",
        active ? "border-[#082B5C] bg-[#082B5C] text-white shadow-md" : "border-slate-200 bg-white text-[#082B5C]"
      )}
    >
      {Icon ? (
        <div className={cx("grid h-8 w-8 shrink-0 place-items-center rounded-xl", active ? "bg-white/15" : "bg-[#ECF7F8]")}>
          <Icon className={cx("h-4 w-4", active ? "text-white" : "text-[#1C9AA0]")} />
        </div>
      ) : null}
      <span className="min-w-0">
        <span className="block text-sm font-bold">{label}</span>
        {description ? <span className={cx("block truncate text-xs", active ? "text-white/70" : "text-slate-500")}>{description}</span> : null}
      </span>
    </button>
  );
}
