import { Ban, ChartNoAxesColumn, House, Save, ShieldCheck } from "lucide-react";

import { usePrototype } from "../context/PrototypeProvider.jsx";
import { StatusBar } from "../components/layout/index.js";
import { ActionCard, MiniStat, PrimaryAction } from "../components/ui/index.js";

export function ReviewScreen() {
  const { setScreen, blockedTracks, setBlockedTracks, focusStats } = usePrototype();
  const review = focusStats.lastSessionSummary;
  const alreadyBlocked = blockedTracks.includes(review.blockedSuggestion);

  return (
    <div className="h-full overflow-hidden bg-[#FAFCFE]">
      <StatusBar />
      <div className="h-full overflow-y-auto px-5 pb-10 pt-6">
        <div className="rounded-[30px] bg-[linear-gradient(135deg,#082B5C_0%,#0C4B72_58%,#1C9AA0_100%)] p-5 text-white shadow-xl">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">Session review</div>
          <div className="mt-3 text-3xl font-black tracking-tight">Sesi selesai</div>
          <p className="mt-2 text-sm leading-6 text-cyan-50/90">
            Anda menyelesaikan {review.duration}. FocusTunes menemukan beberapa sinyal untuk memperbaiki preset berikutnya.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <MiniStat label="Durasi" value={`${review.durationMinutes}m`} />
            <MiniStat label="Skip" value={`${review.skipCount}`} />
            <MiniStat label="Saved" value={`${focusStats.savedPresets}`} />
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <ActionCard
            icon={Ban}
            title="Lagu paling perlu direview"
            subtitle={review.blockedSuggestion}
            action={alreadyBlocked ? "Blocked" : "Review"}
            onClick={() => setBlockedTracks((prev) => (prev.includes(review.blockedSuggestion) ? prev : [...prev, review.blockedSuggestion]))}
          />
          <ActionCard icon={Save} title="Preset yang dipakai" subtitle={review.savedSetup} action="Saved" onClick={() => setScreen("preset")} />
          <ActionCard
            icon={ShieldCheck}
            title="Completion rate"
            subtitle={`Setup ${review.setupSeconds} detik • ${review.skipCount} skip pada sesi ini`}
            action={`${review.completionRate}%`}
            onClick={() => setScreen("stats")}
          />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <PrimaryAction variant="secondary" icon={House} onClick={() => setScreen("home")}>
            Home
          </PrimaryAction>
          <PrimaryAction icon={ChartNoAxesColumn} onClick={() => setScreen("stats")}>
            Statistik
          </PrimaryAction>
        </div>
      </div>
    </div>
  );
}
