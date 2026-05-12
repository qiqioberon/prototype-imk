import { Pause, Play, Volume2 } from "lucide-react";

import { initialQueueTracks } from "../../data.js";
import { usePrototype } from "../../context/PrototypeProvider.jsx";
import { cx } from "../../lib/format.js";

export function NowPlayingBar({ floating = false }) {
  const { setScreen, isMusicPlaying, setIsMusicPlaying, queueList, t } = usePrototype();
  const current = queueList[0] ?? initialQueueTracks[0];

  return (
    <div
      className={cx(
        "flex items-center gap-3 rounded-2xl bg-[#041C26] px-3 py-2.5 text-left text-white",
        floating ? "absolute bottom-[92px] left-4 right-4 z-20 shadow-2xl" : "shadow-lg"
      )}
    >
      <button onClick={() => setScreen("player")} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <div className="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-cyan-500/20 to-sky-300/10 ring-1 ring-white/10" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{current.title}</div>
          <div className="truncate text-[11px] uppercase tracking-[0.18em] text-emerald-400">{current.artist}</div>
        </div>
      </button>
      <div className="flex items-center gap-3">
        <Volume2 className="h-4 w-4 text-emerald-400" />
        <button
          onClick={() => setIsMusicPlaying((prev) => !prev)}
          className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white"
          aria-label={isMusicPlaying ? t("layout.pauseMusic") : t("layout.playMusic")}
        >
          {isMusicPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
