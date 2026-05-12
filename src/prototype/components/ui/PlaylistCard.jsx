import { Music4 } from "lucide-react";

import { cx } from "../../lib/format.js";

export function PlaylistCard({ playlist, selected = false, compact = false, match, insight, onClick, onUse, onQueue, onOffline }) {
  return (
    <div className={cx("rounded-[22px] bg-white p-2 shadow-sm ring-1", selected ? "ring-[#1C9AA0]" : "ring-slate-100")}>
      <button onClick={onClick} className="w-full text-left">
        <div className={cx("relative overflow-hidden rounded-[16px] bg-gradient-to-br", playlist.accent, compact ? "h-20" : "h-28")}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(8,43,92,0.15),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(28,154,160,0.18),transparent_35%)]" />
          <Music4 className="absolute bottom-3 left-3 h-5 w-5 text-[#082B5C]" />
          {typeof match === "number" ? (
            <div className="absolute left-3 top-3 rounded-full bg-[#082B5C]/85 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">
              {match}% fit
            </div>
          ) : null}
          {playlist.offline ? (
            <div className="absolute right-3 top-3 rounded-full bg-white/80 px-2 py-1 text-[10px] font-bold text-[#082B5C]">OFF</div>
          ) : null}
        </div>
        <div className="px-1 pb-1 pt-2">
          <div className="truncate text-sm font-bold text-[#082B5C]">{playlist.title}</div>
          <div className="truncate text-xs text-slate-500">{playlist.subtitle}</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {playlist.tags.slice(0, compact ? 2 : 3).map((tag) => (
              <span key={tag} className="rounded-full bg-[#F1F7FA] px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                {tag}
              </span>
            ))}
          </div>
          {insight ? <div className="mt-2 text-[11px] font-medium text-slate-500">{insight}</div> : null}
        </div>
      </button>
      {!compact ? (
        <div className="mt-2 grid grid-cols-3 gap-2">
          <button onClick={onUse} className="rounded-xl bg-[#082B5C] px-2 py-2 text-[11px] font-semibold text-white">
            Pakai
          </button>
          <button onClick={onQueue} className="rounded-xl bg-[#ECF7F8] px-2 py-2 text-[11px] font-semibold text-[#1C9AA0]">
            Queue
          </button>
          <button onClick={onOffline} className="rounded-xl bg-[#EEF4FF] px-2 py-2 text-[11px] font-semibold text-[#2F6DF6]">
            Offline
          </button>
        </div>
      ) : null}
    </div>
  );
}
