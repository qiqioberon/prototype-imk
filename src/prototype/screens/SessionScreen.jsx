import { useMemo } from "react";
import { ChevronRight, Filter, Headphones, ListOrdered, Music4, WifiOff } from "lucide-react";

import { brand } from "../data.js";
import { usePrototype } from "../context/PrototypeProvider.jsx";
import { AppPage, NowPlayingBar, TopTabs } from "../components/layout/index.js";
import { SectionTitle, ToggleCard } from "../components/ui/index.js";

export function SessionScreen() {
  const {
    activity,
    selectedPlaylist,
    focusDuration,
    selectedContext,
    filters,
    setFilters,
    setScreen,
    isSessionPaused,
    queueList,
    queueInsights,
    sessionState,
    sessionProgress,
    sessionSummaryData,
    startSession,
    toggleSessionPause,
    finishSession,
    t,
    getActivityInfo,
    getContextInfo,
  } = usePrototype();
  const hasStarted = sessionState.hasStarted;
  const activityInfo = getActivityInfo(activity);
  const contextInfo = getContextInfo(selectedContext);
  const progress = hasStarted ? sessionProgress : queueInsights.readiness / 100;
  const ring = useMemo(
    () => ({
      background: `conic-gradient(${isSessionPaused ? "#94A3B8" : brand.teal} ${progress * 360}deg, rgba(8,43,92,0.10) 0deg)`,
    }),
    [progress, isSessionPaused]
  );

  const toggles = [
    { key: "playlist", label: t("sessionScreen.presetQueue"), icon: Music4, note: selectedPlaylist.title },
    { key: "lyrics", label: t("sessionScreen.lyricFilter"), icon: Filter, note: selectedPlaylist.lyricLabel },
    { key: "noise", label: t("sessionScreen.noiseCancellation"), icon: Headphones, note: t("sessionScreen.noiseNote", { context: contextInfo.label }) },
    {
      key: "offline",
      label: t("sessionScreen.offlineFallback"),
      icon: WifiOff,
      note: selectedPlaylist.offline ? t("sessionScreen.offlineSafe") : t("sessionScreen.offlineNeed"),
    },
  ];
  const sessionLabel = !hasStarted ? t("sessionScreen.ready") : isSessionPaused ? t("sessionScreen.paused") : t("sessionScreen.active");
  const sessionCopy = !hasStarted
    ? t("sessionScreen.readyCopy")
    : isSessionPaused
      ? t("sessionScreen.pausedCopy")
      : t("sessionScreen.activeCopy", { playlist: selectedPlaylist.title, context: contextInfo.label });

  return (
    <AppPage showMiniPlayer={false}>
      <div className="h-full overflow-y-auto px-5 pb-[180px] pt-3">
        <TopTabs />

        <div className="mt-5 rounded-[30px] border border-cyan-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{sessionLabel}</div>
              <div className="mt-2 text-2xl font-black tracking-tight text-[#082B5C]">{t("sessionScreen.modeTitle", { activity: activityInfo.label })}</div>
              <p className="mt-2 text-sm leading-6 text-slate-500">{sessionCopy}</p>
            </div>
            <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full" style={ring}>
              <div className="grid h-20 w-20 place-items-center rounded-full bg-white shadow-inner">
                <div className="text-center">
                  <div className="text-xl font-black tracking-tight text-[#082B5C]">
                    {!hasStarted ? `${queueInsights.readiness}%` : isSessionPaused ? t("sessionScreen.paused") : sessionSummaryData.remainingLabel}
                  </div>
                  <div className="text-[10px] text-slate-500">{hasStarted ? `${focusDuration}:00` : t("sessionScreen.queueReady")}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <SessionStat label={hasStarted ? t("sessionScreen.remaining") : t("sessionScreen.queue")} value={hasStarted ? t("sessionScreen.songs", { count: queueList.length }) : t("common.minutesShort", { value: queueInsights.totalMinutes })} />
            <SessionStat label={hasStarted ? t("common.skip") : t("sessionScreen.health")} value={hasStarted ? `${sessionState.skipCount}` : `${queueInsights.readiness}%`} />
            <SessionStat label={t("sessionScreen.setup")} value={t("sessionScreen.seconds", { value: sessionState.setupSeconds })} />
          </div>
        </div>

        <div className="mt-5">
          <SectionTitle title={t("sessionScreen.nowPlaying")} action={hasStarted ? t("sessionScreen.tapToView") : t("sessionScreen.preview")} />
          <div className="mt-3">
            <NowPlayingBar />
          </div>
        </div>

        <div className="mt-6">
          <SectionTitle title={t("sessionScreen.focusSetup")} action={t("common.saved")} />
          <div className="mt-3 grid grid-cols-2 gap-3">
            {toggles.map(({ key, label, note, icon: Icon }) => (
              <ToggleCard
                key={key}
                icon={Icon}
                title={label}
                note={note}
                enabled={filters[key]}
                onClick={() => setFilters((prev) => ({ ...prev, [key]: !prev[key] }))}
              />
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-[26px] bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#ECF7F8] text-[#1C9AA0]">
              <ListOrdered className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[#082B5C]">{t("sessionScreen.queueSafe")}</div>
              <div className="mt-1 text-xs leading-5 text-slate-500">{queueInsights.note}</div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {queueList.slice(0, 3).map((track, idx) => (
              <QueuePreviewRow key={track.id} index={idx + 1} title={track.title} length={track.length} />
            ))}
          </div>
          <button
            onClick={() => setScreen("queue")}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#BFD1EA] bg-white px-4 py-3 text-sm font-semibold text-[#082B5C]"
          >
            {t("sessionScreen.viewQueue")} <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="absolute bottom-[106px] left-5 right-5 z-20 flex gap-3">
        <button
          onClick={() => (hasStarted ? toggleSessionPause() : startSession())}
          className="flex-1 rounded-2xl bg-[#2F6DF6] px-4 py-4 text-sm font-semibold text-white shadow-lg"
        >
          {!hasStarted ? t("sessionScreen.startSession") : isSessionPaused ? t("sessionScreen.resumeSession") : t("sessionScreen.pauseSession")}
        </button>
        <button
          onClick={() => (hasStarted ? finishSession() : setScreen("preset"))}
          className="rounded-2xl border border-[#BFD1EA] bg-white px-6 py-4 text-sm font-semibold text-[#082B5C]"
        >
          {hasStarted ? t("sessionScreen.finish") : t("sessionScreen.editPreset")}
        </button>
      </div>
    </AppPage>
  );
}

function SessionStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#F7FAFC] px-2 py-3 ring-1 ring-slate-100">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className="mt-1 truncate text-sm font-black text-[#082B5C]">{value}</div>
    </div>
  );
}

function QueuePreviewRow({ index, title, length }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5">
      <div className="grid h-8 w-8 place-items-center rounded-xl bg-white text-xs font-bold text-slate-500">{index}</div>
      <div className="min-w-0 flex-1 truncate text-sm font-semibold text-[#082B5C]">{title}</div>
      <div className="text-xs font-medium text-slate-400">{length}</div>
    </div>
  );
}
