import { ChevronDown, Heart, ListOrdered, MoreHorizontal, Pause, Play, Repeat2, Share2, Shuffle, SkipBack, SkipForward, Timer, Volume2 } from "lucide-react";

import { initialQueueTracks } from "../data.js";
import { usePrototype } from "../context/PrototypeProvider.jsx";
import { StatusBar } from "../components/layout/index.js";
import { clamp, formatClock, parseTrackLength } from "../lib/format.js";

export function PlayerScreen() {
  const {
    setScreen,
    isMusicPlaying,
    setIsMusicPlaying,
    isSessionPaused,
    isCurrentTrackLiked,
    isShuffleEnabled,
    repeatMode,
    queueList,
    selectedPlaylist,
    currentTrack,
    sessionProgress,
    sessionState,
    sessionSummaryData,
    showTimerInPlayer,
    rotateQueue,
    toggleLikedTrack,
    toggleShuffleMode,
    cycleRepeatMode,
    shareCurrentTrack,
    skipCurrentTrack,
    t,
  } = usePrototype();
  const current = currentTrack ?? queueList[0] ?? initialQueueTracks[0];
  const trackProgress = clamp(sessionState.hasStarted ? sessionProgress : 0.42, 0.05, 0.97);
  const trackLengthSeconds = parseTrackLength(current.length);
  const elapsedTrackSeconds = Math.round(trackLengthSeconds * trackProgress);
  const remainingTrackSeconds = Math.max(0, trackLengthSeconds - elapsedTrackSeconds);
  const lyricHeadline = current.focusSafe === false ? t("player.highEnergy") : t("player.focusSafeTrack");
  const lyricBody = current.focusSafe === false ? t("player.highEnergyBody") : t("player.focusSafeBody");
  const timerStatus = !sessionState.hasStarted ? t("player.timerReady") : isSessionPaused ? t("player.timerPaused") : t("player.timerActive");
  const repeatLabel = repeatMode === "all" ? t("player.repeatAll") : repeatMode === "one" ? t("player.repeatOne") : t("player.repeatOff");

  return (
    <div className="h-full overflow-hidden bg-[#19191D] text-white">
      <StatusBar dark={false} />
      <div className="h-full overflow-y-auto px-5 pb-10 pt-7">
        <div className="text-sm font-medium text-white/45">{t("player.trackView")}</div>

        <div className="mt-3 rounded-[28px] bg-[linear-gradient(180deg,#A51F18_0%,#5B0907_52%,#1A1111_100%)] px-4 pb-5 pt-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <button onClick={() => setScreen("session")} className="grid h-9 w-9 place-items-center rounded-full text-white/90">
              <ChevronDown className="h-5 w-5" />
            </button>
            <div className="truncate text-sm font-bold">{selectedPlaylist.title}</div>
            <button className="grid h-9 w-9 place-items-center rounded-full text-white/90">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>

          {showTimerInPlayer ? (
            <button
              onClick={() => setScreen("session")}
              className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-white/10 px-3 py-3 text-left ring-1 ring-white/10"
            >
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-emerald-300">
                <Timer className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-300">{t("player.focusTimer")}</div>
                <div className="truncate text-sm font-semibold text-white">{timerStatus}</div>
              </div>
              <div className="text-xs text-white/60">
                {sessionState.hasStarted ? t("player.remaining", { time: sessionSummaryData.remainingLabel }) : "--:--"}
              </div>
            </button>
          ) : null}

          <div className="mx-auto mt-8 grid aspect-square w-[86%] place-items-center bg-[#C63B2E] shadow-[0_26px_60px_rgba(0,0,0,0.28)]">
            <div className="text-center">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-yellow-200">FocusTunes</div>
              <div className="mt-2 text-[7rem] font-black leading-none text-yellow-100">1</div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-yellow-100/80">Deep Flow</div>
            </div>
          </div>

          <div className="mt-10 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="truncate text-lg font-black">{current.title}</div>
              <div className="mt-1 truncate text-sm text-white/55">{current.artist}</div>
            </div>
            <button
              onClick={() => toggleLikedTrack(current)}
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition ${isCurrentTrackLiked ? "bg-white text-[#B91C1C]" : "text-white/80"}`}
              aria-label={isCurrentTrackLiked ? t("player.favoriteRemoveAria") : t("player.favoriteSaveAria")}
            >
              <Heart className="h-5 w-5" fill={isCurrentTrackLiked ? "currentColor" : "none"} />
            </button>
          </div>

          <div className="mt-5">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/30">
              <div className="h-full rounded-full bg-white" style={{ width: `${trackProgress * 100}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-white/55">
              <span>{formatClock(elapsedTrackSeconds)}</span>
              <span>-{formatClock(remainingTrackSeconds)}</span>
            </div>
          </div>

          <div className="mt-7 flex items-center justify-between">
            <button onClick={toggleShuffleMode} className={isShuffleEnabled ? "text-emerald-400" : "text-white/75"} aria-label={t("player.shuffleAria")}>
              <Shuffle className="h-5 w-5" />
            </button>
            <button onClick={() => rotateQueue("previous")} className="text-white">
              <SkipBack className="h-7 w-7" />
            </button>
            <button
              onClick={() => setIsMusicPlaying((prev) => !prev)}
              className="grid h-16 w-16 place-items-center rounded-full bg-white text-[#4E0A08] shadow-xl"
              aria-label={isMusicPlaying ? t("layout.pauseMusic") : t("layout.playMusic")}
            >
              {isMusicPlaying ? <Pause className="h-7 w-7" /> : <Play className="ml-1 h-7 w-7" />}
            </button>
            <button onClick={skipCurrentTrack} className="text-white">
              <SkipForward className="h-7 w-7" />
            </button>
            <button
              onClick={cycleRepeatMode}
              className={repeatMode === "off" ? "text-white/75" : "text-emerald-400"}
              aria-label={t("player.repeatAria")}
            >
              <Repeat2 className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em]">
            <span className={isShuffleEnabled ? "text-emerald-400" : "text-white/45"}>{isShuffleEnabled ? t("player.shuffleOn") : t("player.shuffleOff")}</span>
            <span className="text-white/45">{repeatLabel}</span>
          </div>

          <div className="mt-7 flex items-center justify-between text-white/70">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-400">
              <Volume2 className="h-4 w-4" /> {isMusicPlaying ? t("player.musicPlaying") : t("player.musicPaused")}
            </div>
            <div className="flex items-center gap-5">
              <button onClick={() => shareCurrentTrack(current)} aria-label={t("player.shareAria")}>
                <Share2 className="h-5 w-5" />
              </button>
              <button onClick={() => setScreen("queue")} aria-label={t("player.queueAria")}>
                <ListOrdered className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[24px] bg-[#E46F24] p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-base font-black">{t("player.lyrics")}</div>
            <button className="rounded-full bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em]">{t("player.more")}</button>
          </div>
          <div className="mt-5 space-y-3 text-xl font-black leading-7 text-white/90">
            <p>{lyricHeadline}</p>
            <p className="text-white/55">{current.lyric ? t("player.lyricDetected", { lyric: current.lyric }) : t("player.noLyrics")}</p>
            <p className="text-white/55">{lyricBody}</p>
          </div>
        </div>

        <div className="mt-5 rounded-[24px] bg-white/[0.08] p-4 ring-1 ring-white/10">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-black">{t("player.queue")}</div>
              <div className="text-xs text-white/45">{t("player.upNext")}</div>
            </div>
            <button onClick={() => setScreen("queue")} className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-400">
              {t("player.open")}
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {queueList.slice(0, 5).map((track, idx) => (
              <div key={track.id} className="flex items-center gap-3 rounded-2xl bg-white/[0.06] px-3 py-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-sm font-bold text-white/60">{idx + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-white">{track.title}</div>
                  <div className="truncate text-xs text-white/45">{track.artist}</div>
                </div>
                <div className="text-xs text-white/45">{track.length}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
