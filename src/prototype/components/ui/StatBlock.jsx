import { ChevronRight } from "lucide-react";

export function StatBlock({ label, value, icon: Icon }) {
  return (
    <div className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center justify-between gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#ECF7F8] text-[#1C9AA0]">
          <Icon className="h-5 w-5" />
        </div>
        <ChevronRight className="h-4 w-4 text-slate-300" />
      </div>
      <div className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-black text-[#082B5C]">{value}</div>
    </div>
  );
}
