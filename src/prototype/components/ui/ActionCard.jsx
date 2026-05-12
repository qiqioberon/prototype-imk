import { ChevronRight } from "lucide-react";

export function ActionCard({ icon: Icon, title, subtitle, action, onClick }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-[22px] bg-white px-4 py-4 text-left shadow-sm ring-1 ring-slate-100">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#ECF7F8] text-[#1C9AA0]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-[#082B5C]">{title}</div>
        <div className="truncate text-xs text-slate-500">{subtitle}</div>
      </div>
      {action ? <div className="rounded-full bg-[#EEF4FF] px-2.5 py-1 text-[10px] font-semibold text-[#2F6DF6]">{action}</div> : <ChevronRight className="h-4 w-4 text-slate-300" />}
    </button>
  );
}
