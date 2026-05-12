import { ArrowDown, ArrowUp, Ban, Trash2 } from "lucide-react";

import { IconButton } from "./IconButton.jsx";

export function QueueTrackRow({ track, index, onUp, onDown, onRemove, onBlock }) {
  return (
    <div className="rounded-[22px] bg-white p-3 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-500">{index + 1}</div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-[#082B5C]">{track.title}</div>
          <div className="truncate text-xs text-slate-400">
            {track.artist} - {track.length} {track.offline ? "- offline" : ""}
          </div>
        </div>
        {track.distracting ? <Ban className="h-4 w-4 text-rose-500" /> : null}
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        <IconButton label="Up" icon={ArrowUp} onClick={onUp} />
        <IconButton label="Down" icon={ArrowDown} onClick={onDown} />
        <IconButton label="Block" icon={Ban} onClick={onBlock} />
        <IconButton label="Remove" icon={Trash2} onClick={onRemove} />
      </div>
    </div>
  );
}
