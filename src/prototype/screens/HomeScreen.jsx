import { Download, Edit3, Settings2, Sparkles } from "lucide-react";

import { contextOptions, focusActivities } from "../data.js";
import { usePrototype } from "../context/PrototypeProvider.jsx";
import { AppPage, TopTabs } from "../components/layout/index.js";
import { ActionCard, MiniStat, PlaylistCard, SectionTitle } from "../components/ui/index.js";
import { cx } from "../lib/format.js";

export function HomeScreen() {
  const {
    setScreen,
    activity,
    setActivity,
    selectedContext,
    setSelectedContext,
    selectedPlaylist,
    setSelectedPlaylistDetailId,
    focusDuration,
    lyricPreference,
    autoDownload,
    setAutoDownload,
    recommendedPlaylists,
    queueInsights,
    startSession,
  } = usePrototype();
  const selected = focusActivities[activity];
  const recommended = recommendedPlaylists.slice(0, 3);
  const topRecommendation = recommended[0] ?? selectedPlaylist;

  return (
    <AppPage>
      <div className="h-full overflow-y-auto px-5 pb-44 pt-3">
        <TopTabs />

        <div className="mt-5 flex items-start justify-between gap-3">
          <div>
            <div className="text-[28px] font-black tracking-tight text-[#082B5C]">Siap fokus?</div>
            <div className="text-sm leading-6 text-slate-500">
              {activity} mode - {selectedContext} - {focusDuration} menit
            </div>
          </div>
          <div className="rounded-2xl bg-[#ECF7F8] px-3 py-2 text-right">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#1C9AA0]">Ready</div>
            <div className="text-sm font-black text-[#082B5C]">{queueInsights.readiness}%</div>
          </div>
        </div>

        <div className="mt-4 rounded-[28px] bg-[linear-gradient(135deg,#082B5C_0%,#0C4B72_58%,#1C9AA0_100%)] p-5 text-white shadow-xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
            <Sparkles className="h-4 w-4" /> One-Tap Focus
          </div>
          <h2 className="mt-3 max-w-[270px] text-[2rem] font-black leading-tight tracking-tight">{selected.title}</h2>
          <p className="mt-3 text-[15px] leading-7 text-cyan-50/90">{selected.description}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {Object.values(focusActivities).map((item) => (
              <button
                key={item.label}
                onClick={() => setActivity(item.label)}
                className={cx(
                  "rounded-full px-3.5 py-2 text-sm font-semibold transition",
                  activity === item.label ? "bg-white text-[#082B5C]" : "bg-white/10 text-white ring-1 ring-white/20"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            <MiniStat label="Playlist" value={selectedPlaylist.title.split(" ")[0]} />
            <MiniStat label="Durasi" value={`${focusDuration}m`} />
            <MiniStat label="Lirik" value={lyricPreference === "Tanpa lirik" ? "Low" : lyricPreference === "Bebas" ? "Flex" : "Mix"} />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button onClick={() => setScreen("preset")} className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/15">
              Edit Preset
            </button>
            <button onClick={() => startSession()} className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#082B5C]">
              Mulai Sesi
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-[26px] border border-[#CFE6EC] bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#ECF7F8] text-[#1C9AA0]">
              <Edit3 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[#082B5C]">Focus briefing</div>
              <div className="mt-1 text-xs leading-5 text-slate-500">
                Queue health {queueInsights.readiness}% dengan rekomendasi teratas {topRecommendation.title}.
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#F7FAFC] px-3 py-3 ring-1 ring-slate-100">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Next best fit</div>
              <div className="mt-1 truncate text-sm font-black text-[#082B5C]">{topRecommendation.title}</div>
              <div className="mt-1 text-xs text-slate-500">{topRecommendation.match}% fit • {topRecommendation.insight}</div>
            </div>
            <div className="rounded-2xl bg-[#F7FAFC] px-3 py-3 ring-1 ring-slate-100">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Queue status</div>
              <div className="mt-1 text-sm font-black text-[#082B5C]">{queueInsights.totalMinutes}m coverage</div>
              <div className="mt-1 text-xs text-slate-500">{queueInsights.note}</div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <SectionTitle title="Kondisi sekarang" />
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {contextOptions.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedContext(item.id)}
                className={cx(
                  "flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold",
                  selectedContext === item.id ? "border-[#082B5C] bg-[#082B5C] text-white" : "border-slate-200 bg-white text-[#082B5C]"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <ActionCard icon={Settings2} title="Preset siap" subtitle={`${selectedPlaylist.title} • ${lyricPreference}`} action="Edit" onClick={() => setScreen("preset")} />
          <ActionCard
            icon={Download}
            title="Offline cache"
            subtitle={autoDownload ? `${queueInsights.offlineCount} lagu siap offline` : "Ketuk untuk aktifkan"}
            action={autoDownload ? "Ready" : "Off"}
            onClick={() => setAutoDownload((prev) => !prev)}
          />
        </div>

        <div className="mt-6">
          <SectionTitle title="Rekomendasi untuk konteks ini" action="Music" onAction={() => setScreen("music")} />
          <div className="mt-3 grid grid-cols-3 gap-3">
            {recommended.map((item) => (
              <PlaylistCard
                key={item.id}
                playlist={item}
                compact
                match={item.match}
                insight={item.insight}
                onClick={() => {
                  setSelectedPlaylistDetailId(item.id);
                  setScreen("music");
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </AppPage>
  );
}
