import { Ban, ChartNoAxesColumn, House, Save, ShieldCheck } from "lucide-react";

import { usePrototype } from "../context/PrototypeProvider.jsx";
import { StatusBar } from "../components/layout/index.js";
import { ActionCard, MiniStat, PrimaryAction } from "../components/ui/index.js";

export function ReviewScreen() {
  const { setScreen, blockedTracks, setBlockedTracks, focusStats, t, showBlockedReasons, getTrackFocusReason } = usePrototype();
  const review = focusStats.lastSessionSummary;
  const alreadyBlocked = blockedTracks.includes(review.blockedSuggestion);
  const reviewTrack = { title: review.blockedSuggestion, focusSafe: false, offline: false };

  return (
    <div className="h-full overflow-hidden bg-[#FAFCFE]">
      <StatusBar />
      <div className="h-full overflow-y-auto px-5 pb-10 pt-6">
        <div className="rounded-[30px] bg-[linear-gradient(135deg,#082B5C_0%,#0C4B72_58%,#1C9AA0_100%)] p-5 text-white shadow-xl">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">{t("reviewScreen.eyebrow")}</div>
          <div className="mt-3 text-3xl font-black tracking-tight">{t("reviewScreen.title")}</div>
          <p className="mt-2 text-sm leading-6 text-cyan-50/90">
            {t("reviewScreen.description", { duration: t("common.minutesLong", { value: review.durationMinutes }) })}
          </p>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <MiniStat label={t("reviewScreen.duration")} value={t("common.minutesShort", { value: review.durationMinutes })} />
            <MiniStat label={t("common.skip")} value={`${review.skipCount}`} />
            <MiniStat label={t("reviewScreen.saved")} value={`${focusStats.savedPresets}`} />
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <ActionCard
            icon={Ban}
            title={t("reviewScreen.trackReview")}
            subtitle={showBlockedReasons ? t("reviewScreen.reviewReason", { reason: getTrackFocusReason(reviewTrack) }) : review.blockedSuggestion}
            action={alreadyBlocked ? t("common.blocked") : t("common.review")}
            onClick={() => setBlockedTracks((prev) => (prev.includes(review.blockedSuggestion) ? prev : [...prev, review.blockedSuggestion]))}
          />
          <ActionCard icon={Save} title={t("reviewScreen.usedPreset")} subtitle={review.savedSetup} action={t("common.saved")} onClick={() => setScreen("preset")} />
          <ActionCard
            icon={ShieldCheck}
            title={t("reviewScreen.completionRate")}
            subtitle={t("reviewScreen.completionSubtitle", { setupSeconds: review.setupSeconds, skipCount: review.skipCount })}
            action={`${review.completionRate}%`}
            onClick={() => setScreen("stats")}
          />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <PrimaryAction variant="secondary" icon={House} onClick={() => setScreen("home")}>
            {t("common.home")}
          </PrimaryAction>
          <PrimaryAction icon={ChartNoAxesColumn} onClick={() => setScreen("stats")}>
            {t("reviewScreen.stats")}
          </PrimaryAction>
        </div>
      </div>
    </div>
  );
}
