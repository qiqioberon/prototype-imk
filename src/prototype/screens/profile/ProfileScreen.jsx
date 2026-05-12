import { useState } from "react";
import { Ban, ChartNoAxesColumn, CheckCircle2, Clock3, Languages, ListOrdered, Save, Settings2, ShieldCheck, SlidersHorizontal, Timer, WifiOff } from "lucide-react";

import { durationOptions, lyricOptions } from "../../data.js";
import { usePrototype } from "../../context/PrototypeProvider.jsx";
import { AppPage, TopTabs } from "../../components/layout/index.js";
import { ActionCard, PrimaryAction, SectionTitle, StatBlock, ToggleCard } from "../../components/ui/index.js";
import { cx } from "../../lib/format.js";

export function ProfileScreen() {
  const {
    t,
    locale,
    setLocale,
    activity,
    selectedContext,
    lyricPreference,
    setLyricPreference,
    focusDuration,
    setFocusDuration,
    autoDownload,
    setAutoDownload,
    focusStats,
    blockedTracks,
    setScreen,
    showTimerInPlayer,
    setShowTimerInPlayer,
    showSmartQueueDetails,
    setShowSmartQueueDetails,
    showBlockedReasons,
    setShowBlockedReasons,
    getActivityInfo,
    getContextInfo,
    getLyricLabel,
  } = usePrototype();
  const [tab, setTab] = useState("profile");
  const activityInfo = getActivityInfo(activity);
  const contextInfo = getContextInfo(selectedContext);
  const review = focusStats.lastSessionSummary;

  return (
    <AppPage>
      <div className="h-full overflow-y-auto px-5 pb-44 pt-3">
        <TopTabs />

        <div className="mt-5">
          <div className="text-[28px] font-black tracking-tight text-[#082B5C]">{t("profile.title")}</div>
          <div className="mt-1 text-sm leading-6 text-slate-500">{t("profile.subtitle")}</div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
          {[
            { key: "profile", label: t("profile.profileTab") },
            { key: "settings", label: t("profile.settingsTab") },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={cx(
                "rounded-xl px-3 py-2 text-sm font-bold transition",
                tab === item.key ? "bg-white text-[#082B5C] shadow-sm" : "text-slate-500"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "profile" ? (
          <div className="mt-5 space-y-5">
            <div className="rounded-[28px] bg-[linear-gradient(135deg,#082B5C_0%,#0F4F77_64%,#1C9AA0_100%)] p-5 text-white shadow-lg">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-white/15">
                  <Settings2 className="h-7 w-7" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-xl font-black">{t("profile.accountName")}</div>
                  <div className="truncate text-sm text-cyan-50/85">{t("profile.accountEmail")}</div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100">{t("profile.accountRole")}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatBlock label={t("profile.savedPresets")} value={`${focusStats.savedPresets}`} icon={Save} />
              <StatBlock label={t("profile.blockedTracks")} value={`${blockedTracks.length}`} icon={Ban} />
              <StatBlock label={t("statsScreen.focusStreak")} value={t("common.daysCount", { count: focusStats.streakDays })} icon={CheckCircle2} />
              <StatBlock label={t("statsScreen.totalSession")} value={t("common.sessionsCount", { count: focusStats.completedSessions })} icon={Clock3} />
            </div>

            <div className="rounded-[26px] bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <SectionTitle title={t("profile.focusProfile")} />
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {t("profile.focusProfileCopy", {
                  activity: activityInfo.label,
                  context: contextInfo.label,
                  duration: focusDuration,
                  lyric: getLyricLabel(lyricPreference),
                })}
              </p>
              <div className="mt-4 rounded-2xl bg-[#F7FAFC] p-3 ring-1 ring-slate-100">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{t("profile.lastSession")}</div>
                <div className="mt-1 text-sm font-bold text-[#082B5C]">
                  {t("profile.lastSessionCopy", {
                    duration: t("common.minutesLong", { value: review.durationMinutes }),
                    completionRate: review.completionRate,
                  })}
                </div>
              </div>
            </div>

            <div>
              <SectionTitle title={t("profile.quickActions")} />
              <div className="mt-3 space-y-3">
                <ActionCard icon={SlidersHorizontal} title={t("profile.editPreset")} subtitle={t("preset.description")} action={t("common.edit")} onClick={() => setScreen("preset")} />
                <ActionCard icon={ListOrdered} title={t("profile.reviewQueue")} subtitle={t("queueScreen.blockedTitle")} action={t("common.review")} onClick={() => setScreen("queue")} />
                <ActionCard icon={ChartNoAxesColumn} title={t("profile.openStats")} subtitle={t("statsScreen.description")} action={t("common.open")} onClick={() => setScreen("stats")} />
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            <div className="rounded-[26px] bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#ECF7F8] text-[#1C9AA0]">
                  <Languages className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#082B5C]">{t("profile.language")}</div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">{t("profile.languageCopy")}</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  { key: "id", label: t("profile.id") },
                  { key: "en", label: t("profile.en") },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setLocale(item.key)}
                    className={cx(
                      "rounded-2xl border px-3 py-3 text-sm font-black",
                      locale === item.key ? "border-[#082B5C] bg-[#082B5C] text-white" : "border-slate-200 bg-white text-slate-500"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <ToggleCard
              icon={WifiOff}
              title={t("profile.offlineReady")}
              note={t("profile.offlineReadyCopy")}
              enabled={autoDownload}
              onClick={() => setAutoDownload((prev) => !prev)}
            />

            <div className="rounded-[26px] bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <SectionTitle title={t("profile.defaultDuration")} />
              <div className="mt-3 grid grid-cols-4 gap-2">
                {durationOptions.map((item) => (
                  <button
                    key={item}
                    onClick={() => setFocusDuration(item)}
                    className={cx(
                      "rounded-2xl border px-2 py-3 text-center text-sm font-black",
                      focusDuration === item ? "border-[#1C9AA0] bg-[#ECF7F8] text-[#082B5C]" : "border-slate-200 bg-white text-slate-500"
                    )}
                  >
                    {t("common.minutesShort", { value: item })}
                  </button>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {lyricOptions.map((item) => (
                  <button
                    key={item}
                    onClick={() => setLyricPreference(item)}
                    className={cx(
                      "rounded-2xl border px-2 py-3 text-center text-xs font-bold",
                      lyricPreference === item ? "border-[#082B5C] bg-[#082B5C] text-white" : "border-slate-200 bg-white text-slate-500"
                    )}
                  >
                    {getLyricLabel(item)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <SectionTitle title={t("profile.clarity")} />
              <div className="mt-3 space-y-3">
                <ToggleCard icon={Timer} title={t("profile.timerInPlayer")} note={t("profile.timerInPlayerCopy")} enabled={showTimerInPlayer} onClick={() => setShowTimerInPlayer((prev) => !prev)} />
                <ToggleCard icon={ListOrdered} title={t("profile.smartQueueDetails")} note={t("profile.smartQueueDetailsCopy")} enabled={showSmartQueueDetails} onClick={() => setShowSmartQueueDetails((prev) => !prev)} />
                <ToggleCard icon={ShieldCheck} title={t("profile.blockedReasons")} note={t("profile.blockedReasonsCopy")} enabled={showBlockedReasons} onClick={() => setShowBlockedReasons((prev) => !prev)} />
              </div>
            </div>

            <div className="rounded-[24px] border border-[#CFE6EC] bg-[#F7FAFC] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1C9AA0]">{t("profile.testingNotes")}</div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t("profile.testingNotesCopy")}</p>
            </div>
          </div>
        )}
      </div>
    </AppPage>
  );
}
