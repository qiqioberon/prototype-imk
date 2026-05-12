import { Ban, ListOrdered, Settings2, ShieldCheck } from "lucide-react";

import { usePrototype } from "../context/PrototypeProvider.jsx";
import { AppPage, TopTabs } from "../components/layout/index.js";
import { QueueTrackRow, SectionTitle, StatBlock } from "../components/ui/index.js";

export function QueueScreen() {
  const { activity, queueList, setQueueList, blockedTracks, setBlockedTracks, queueInsights, smartQueue, showToast } = usePrototype();
  const totalMinutes = queueInsights.totalMinutes;
  const offlineCount = queueInsights.offlineCount;

  function moveTrack(index, direction) {
    setQueueList((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removeTrack(id) {
    setQueueList((prev) => prev.filter((item) => item.id !== id));
    showToast("Track dihapus", "Queue diperbarui sesuai preferensi fokus.");
  }

  function blockTrack(track) {
    setBlockedTracks((prev) => (prev.includes(track.title) ? prev : [...prev, track.title]));
    setQueueList((prev) => prev.map((item) => (item.id === track.id ? { ...item, distracting: true } : item)));
    showToast("Track diblokir", `${track.title} tidak akan diprioritaskan lagi.`);
  }

  return (
    <AppPage>
      <div className="h-full overflow-y-auto px-5 pb-44 pt-3">
        <TopTabs />

        <div className="mt-5 flex items-center justify-between">
          <div>
            <div className="text-[28px] font-black tracking-tight text-[#082B5C]">Smart Queue</div>
            <div className="text-sm text-slate-500">Preset untuk {activity.toLowerCase()} session</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={smartQueue}
              className="rounded-2xl bg-[#082B5C] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white"
            >
              Auto fix
            </button>
            <button className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[#082B5C] shadow-sm ring-1 ring-slate-100">
              <Settings2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-[28px] bg-[linear-gradient(135deg,#082B5C_0%,#0F4F77_65%,#1C9AA0_100%)] p-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">Queue Preset</div>
              <div className="mt-2 text-2xl font-black">{queueList.length} lagu siap</div>
              <div className="mt-2 text-sm leading-6 text-cyan-50/90">
                {queueList.length === 0
                  ? "Tambahkan lagu dari Music agar smart queue bisa dihitung."
                  : `Estimasi ${totalMinutes} menit - ${offlineCount}/${queueList.length} lagu offline - ${blockedTracks.length} lagu diblokir`}
              </div>
            </div>
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10">
              <ListOrdered className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <StatBlock label="Queue Health" value={`${queueInsights.readiness}%`} icon={ShieldCheck} />
          <StatBlock label="Need Review" value={`${queueInsights.reviewCount} lagu`} icon={Ban} />
        </div>

        <div className="mt-5 space-y-3">
          {queueList.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-white px-4 py-6 text-center shadow-sm">
              <div className="text-sm font-semibold text-[#082B5C]">Queue masih kosong</div>
              <div className="mt-1 text-xs leading-5 text-slate-500">Tambah lagu dari tab Music atau pakai auto-fix setelah ada beberapa track.</div>
            </div>
          ) : (
            queueList.map((track, idx) => (
              <QueueTrackRow
                key={track.id}
                track={track}
                index={idx}
                onUp={() => moveTrack(idx, -1)}
                onDown={() => moveTrack(idx, 1)}
                onRemove={() => removeTrack(track.id)}
                onBlock={() => blockTrack(track)}
              />
            ))
          )}
        </div>

        <div className="mt-5 rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <SectionTitle title="Blocked in focus" />
          <div className="mt-3 flex flex-wrap gap-2">
            {blockedTracks.map((track) => (
              <span key={track} className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-500">
                {track}
              </span>
            ))}
          </div>
        </div>
      </div>
    </AppPage>
  );
}
