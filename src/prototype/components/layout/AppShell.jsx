import { Settings2, ShieldCheck, Sparkles, WifiOff } from "lucide-react";

import { BrandMark } from "./BrandMark.jsx";
import { FeaturePill } from "../ui/FeaturePill.jsx";
import { PhoneFrame } from "./PhoneFrame.jsx";
import { ReferenceStrip } from "./ReferenceStrip.jsx";
import { ScreenSwitcher } from "./ScreenSwitcher.jsx";
import { usePrototype } from "../../context/PrototypeProvider.jsx";

export function AppShell({ children }) {
  const { t } = usePrototype();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(28,154,160,0.16),_transparent_35%),linear-gradient(180deg,#f5fbfd_0%,#eef5fb_100%)] p-6 md:p-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-center">
        <aside className="w-full max-w-sm rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_60px_rgba(8,43,92,0.10)] backdrop-blur">
          <div className="flex items-center gap-4">
            <BrandMark small />
            <div>
              <div className="text-2xl font-black tracking-tight text-[#082B5C]">
                Focus<span className="text-[#1C9AA0]">Tunes</span>
              </div>
              <p className="text-sm text-slate-500">{t("common.appSubtitle")}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{t("common.screens")}</p>
            <ScreenSwitcher />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <FeaturePill icon={Sparkles} title={t("layout.oneTapFocus")} subtitle={t("layout.oneTapFocusSub")} />
            <FeaturePill icon={Settings2} title={t("layout.presetSetup")} subtitle={t("layout.presetSetupSub")} />
            <FeaturePill icon={ShieldCheck} title={t("layout.distractionReview")} subtitle={t("layout.distractionReviewSub")} />
            <FeaturePill icon={WifiOff} title={t("layout.offlineReady")} subtitle={t("layout.offlineReadySub")} />
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{t("layout.demoNarrativeTitle")}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{t("layout.demoNarrative")}</p>
          </div>

          <ReferenceStrip />
        </aside>

        <div className="flex w-full justify-center">
          <PhoneFrame>{children}</PhoneFrame>
        </div>
      </div>
    </div>
  );
}
