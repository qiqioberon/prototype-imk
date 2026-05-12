import { cx } from "../../lib/format.js";

export function ToggleCard({ icon: Icon, title, note, enabled, onClick }) {
  return (
    <button onClick={onClick} className="flex min-w-0 items-center gap-3 rounded-[22px] bg-white px-3 py-3 text-left shadow-sm ring-1 ring-slate-100">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#ECF7F8] text-[#1C9AA0]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-bold text-[#082B5C]">{title}</div>
        <div className="truncate text-[11px] text-slate-400">{note}</div>
      </div>
      <div className={cx("h-2.5 w-2.5 shrink-0 rounded-full", enabled ? "bg-[#2F6DF6]" : "bg-slate-300")} />
    </button>
  );
}
