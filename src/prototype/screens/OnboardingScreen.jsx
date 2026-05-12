import { Download, Sparkles } from "lucide-react";

import { contextOptions, durationOptions, focusActivities, lyricOptions } from "../data.js";
import { usePrototype } from "../context/PrototypeProvider.jsx";
import { BrandMark, StatusBar } from "../components/layout/index.js";
import { ActionCard, PreferenceChip, PrimaryAction, SectionTitle } from "../components/ui/index.js";
import { cx } from "../lib/format.js";

export function OnboardingScreen() {
  const {
    selectedActivities,
    setSelectedActivities,
    selectedContext,
    setSelectedContext,
    lyricPreference,
    setLyricPreference,
    focusDuration,
    setFocusDuration,
    autoDownload,
    setAutoDownload,
    setActivity,
    savePreset,
    t,
    getActivityInfo,
    getContextInfo,
    getLyricLabel,
  } = usePrototype();

  function toggleActivity(item) {
    setSelectedActivities((prev) => {
      if (prev.includes(item)) {
        return prev.length === 1 ? prev : prev.filter((value) => value !== item);
      }
      return [...prev, item];
    });
    setActivity(item);
  }

  return (
    <div className="h-full overflow-hidden bg-[#FAFCFE]">
      <StatusBar />
      <div className="h-full overflow-y-auto px-5 pb-8 pt-6">
        <div className="flex items-center gap-3">
          <BrandMark small />
          <div>
            <div className="text-2xl font-black tracking-tight text-[#082B5C]">{t("onboarding.title")}</div>
            <div className="text-sm text-slate-500">{t("onboarding.subtitle")}</div>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <div>
            <SectionTitle title={t("onboarding.mainActivity")} />
            <div className="mt-3 grid grid-cols-2 gap-3">
              {Object.values(focusActivities).map((item) => (
                <PreferenceChip
                  key={item.label}
                  active={selectedActivities.includes(item.label)}
                  label={getActivityInfo(item.label).label}
                  description={t("common.minutesLong", { value: item.session })}
                  icon={Sparkles}
                  onClick={() => toggleActivity(item.label)}
                />
              ))}
            </div>
          </div>

          <div>
            <SectionTitle title={t("onboarding.commonCondition")} />
            <div className="mt-3 grid grid-cols-2 gap-3">
              {contextOptions.map((item) => (
                <PreferenceChip
                  key={item.id}
                  active={selectedContext === item.id}
                  label={getContextInfo(item.id).label}
                  description={getContextInfo(item.id).description}
                  icon={item.icon}
                  onClick={() => setSelectedContext(item.id)}
                />
              ))}
            </div>
          </div>

          <div>
            <SectionTitle title={t("onboarding.lyricPreference")} />
            <div className="mt-3 grid grid-cols-3 gap-2">
              {lyricOptions.map((item) => (
                <button
                  key={item}
                  onClick={() => setLyricPreference(item)}
                  className={cx(
                    "rounded-2xl border px-2 py-3 text-center text-xs font-bold",
                    lyricPreference === item ? "border-[#082B5C] bg-[#082B5C] text-white" : "border-slate-200 bg-white text-[#082B5C]"
                  )}
                >
                  {getLyricLabel(item)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle title={t("onboarding.defaultDuration")} />
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
          </div>

          <ActionCard
            icon={Download}
            title={t("onboarding.autoDownloadTitle")}
            subtitle={autoDownload ? t("onboarding.autoDownloadOn") : t("onboarding.autoDownloadOff")}
            action={autoDownload ? t("common.active") : t("common.off")}
            onClick={() => setAutoDownload((prev) => !prev)}
          />

          <PrimaryAction onClick={() => savePreset("home")}>{t("onboarding.saveContinue")}</PrimaryAction>
        </div>
      </div>
    </div>
  );
}
