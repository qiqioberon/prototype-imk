import { Ban, ChartNoAxesColumn, CheckCircle2, ChevronRight, Clock3, ShieldCheck, Sparkles, WifiOff } from "lucide-react";

import { focusInsights, weeklyBars } from "../../data.js";
import { usePrototype } from "../../context/PrototypeProvider.jsx";
import { AppPage, Avatar, TopTabs } from "../../components/layout/index.js";
import { ActionCard, SectionTitle, StatBlock } from "../../components/ui/index.js";

export function StatsScreen() {
  const { blockedTracks, selectedContext, activity, autoDownload, focusStats, setScreen } = usePrototype();
  const totalActivityMinutes = Object.values(focusStats.activityMinutes).reduce((sum, value) => sum + value, 0);
  const activityStats = Object.entries(focusStats.activityMinutes)
    .filter(([, value]) => value > 0)
    .map(([label, value]) => ({
      label,
      value: `${(value / 60).toFixed(1)}h`,
      width: Math.round((value / Math.max(1, totalActivityMinutes)) * 100),
    }))
    .sort((left, right) => right.width - left.width);
  const review = focusStats.lastSessionSummary;
  const statsInsights = [
    {
      title: "Last session",
      value: `${review.duration} • ${review.completionRate}%`,
      note: `${review.skipCount} skip, setup ${review.setupSeconds} detik.`,
    },
    {
      title: "Preset terakhir",
      value: review.savedSetup,
      note: `Track review: ${review.blockedSuggestion}`,
    },
    ...focusInsights,
  ];

  return (
    <AppPage>
      <div className="h-full overflow-y-auto px-5 pb-44 pt-3">
        <TopTabs />

        <div className="mt-5 flex items-center justify-between">
          <div>
            <div className="text-[28px] font-black tracking-tight text-[#082B5C]">Focus Stats</div>
            <div className="text-sm text-slate-500">Insight untuk memperbaiki preset berikutnya</div>
          </div>
          <Avatar />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <StatBlock label="Focus Streak" value={`${focusStats.streakDays} hari`} icon={CheckCircle2} />
          <StatBlock label="Total Session" value={`${focusStats.completedSessions} sesi`} icon={Clock3} />
          <StatBlock label="Distraksi Turun" value={`${focusStats.distractionDelta}%`} icon={ShieldCheck} />
          <StatBlock label="Offline Success" value={`${autoDownload ? focusStats.offlineSuccessRate : Math.max(72, focusStats.offlineSuccessRate - 11)}%`} icon={WifiOff} />
        </div>

        <div className="mt-5 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-[#082B5C]">Weekly Focus Flow</div>
              <div className="text-xs text-slate-400">Jam fokus efektif per hari</div>
            </div>
            <ChartNoAxesColumn className="h-5 w-5 text-[#1C9AA0]" />
          </div>

          <div className="mt-5 grid grid-cols-7 gap-2">
            {weeklyBars.map((bar) => (
              <div key={bar.day} className="flex min-w-0 flex-col items-center gap-2">
                <div className="text-[10px] font-bold text-[#082B5C]">{bar.hours}</div>
                <div className="flex h-28 w-full items-end overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-100">
                  <div className="w-full rounded-full bg-[linear-gradient(180deg,#1C9AA0_0%,#082B5C_100%)]" style={{ height: `${bar.height}%` }} />
                </div>
                <span className="text-[10px] font-medium text-slate-400">{bar.day}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <StatsMiniCard label="Total" value={`${(focusStats.totalFocusMinutes / 60).toFixed(1)}h`} />
            <StatsMiniCard label="Best" value={focusInsights[0].value} />
            <StatsMiniCard label="Context" value={selectedContext} />
          </div>
        </div>

        <div className="mt-5 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <SectionTitle title="Distribusi aktivitas" />
          <div className="mt-4 space-y-3">
            {activityStats.map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#082B5C]">{item.label}</span>
                  <span className="text-slate-400">{item.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-[#1C9AA0]" style={{ width: `${item.width}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {statsInsights.map((item) => (
            <InsightCard key={item.title} title={item.title} value={item.value} note={item.note} />
          ))}
          <ActionCard icon={Ban} title="Blocked tracks" subtitle={`${blockedTracks.length} lagu tidak muncul di ${activity} Mode`} action="Review" onClick={() => setScreen("queue")} />
        </div>
      </div>
    </AppPage>
  );
}

function StatsMiniCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#F7FAFC] px-3 py-3 text-center ring-1 ring-slate-100">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className="mt-1 truncate text-sm font-black text-[#082B5C]">{value}</div>
    </div>
  );
}

function InsightCard({ title, value, note }) {
  return (
    <button className="flex w-full items-center gap-3 rounded-[22px] bg-white px-4 py-4 text-left shadow-sm ring-1 ring-slate-100">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#ECF7F8] text-[#1C9AA0]">
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{title}</div>
        <div className="truncate text-sm font-semibold text-[#082B5C]">{value}</div>
        <div className="truncate text-xs text-slate-400">{note}</div>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-300" />
    </button>
  );
}
