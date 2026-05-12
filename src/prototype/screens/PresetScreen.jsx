import { Filter, Headphones, ListOrdered, Minus, Play, Plus, Save, WifiOff } from "lucide-react";

import { durationOptions, lyricOptions, playlists } from "../data.js";
import { usePrototype } from "../context/PrototypeProvider.jsx";
import { AppPage, TopTabs } from "../components/layout/index.js";
import { PlaylistCard, PrimaryAction, SectionTitle, ToggleCard } from "../components/ui/index.js";
import { cx } from "../lib/format.js";

export function PresetScreen() {
  const {
    activity,
    selectedPlaylist,
    selectedPlaylistId,
    setSelectedPlaylistId,
    lyricPreference,
    setLyricPreference,
    focusDuration,
    setFocusDuration,
    autoDownload,
    setAutoDownload,
    volumeLevel,
    setVolumeLevel,
    filters,
    setFilters,
    savePreset,
    startSession,
  } = usePrototype();

  const playlistChoices = playlists.filter((item) => item.activity === activity || item.offline).slice(0, 4);

  return (
    <AppPage showMiniPlayer={false}>
      <div className="h-full overflow-y-auto px-5 pb-36 pt-3">
        <TopTabs />

        <div className="mt-5">
          <div className="text-[28px] font-black tracking-tight text-[#082B5C]">Setup Preset</div>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Simpan ritual fokus agar sesi berikutnya langsung jalan tanpa setup ulang.
          </p>
        </div>

        <div className="mt-5 rounded-[28px] bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <SectionTitle title="Playlist utama" action={selectedPlaylist.duration + "m"} />
          <div className="mt-3 grid grid-cols-2 gap-3">
            {playlistChoices.map((item) => (
              <PlaylistCard
                key={item.id}
                playlist={item}
                compact
                selected={selectedPlaylistId === item.id}
                onClick={() => setSelectedPlaylistId(item.id)}
              />
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-[28px] bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <SectionTitle title="Kontrol sesi" />
          <div className="mt-4 space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-[#082B5C]">Durasi fokus</span>
                <span className="font-black text-[#1C9AA0]">{focusDuration} menit</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {durationOptions.map((item) => (
                  <button
                    key={item}
                    onClick={() => setFocusDuration(item)}
                    className={cx(
                      "rounded-2xl border px-2 py-3 text-sm font-black",
                      focusDuration === item ? "border-[#082B5C] bg-[#082B5C] text-white" : "border-slate-200 bg-white text-slate-500"
                    )}
                  >
                    {item}m
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-[#082B5C]">Volume awal</span>
                <span className="font-black text-[#1C9AA0]">{volumeLevel}%</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-[#F7FAFC] p-3 ring-1 ring-slate-100">
                <button onClick={() => setVolumeLevel((prev) => Math.max(20, prev - 5))} className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#082B5C]">
                  <Minus className="h-4 w-4" />
                </button>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-[#1C9AA0]" style={{ width: `${volumeLevel}%` }} />
                </div>
                <button onClick={() => setVolumeLevel((prev) => Math.min(90, prev + 5))} className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#082B5C]">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {lyricOptions.map((item) => (
                <button
                  key={item}
                  onClick={() => setLyricPreference(item)}
                  className={cx(
                    "rounded-2xl border px-2 py-3 text-center text-xs font-bold",
                    lyricPreference === item ? "border-[#1C9AA0] bg-[#ECF7F8] text-[#082B5C]" : "border-slate-200 bg-white text-slate-500"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {[
            { key: "playlist", title: "Preset queue", note: "urutan lagu tersimpan", icon: ListOrdered },
            { key: "lyrics", title: "Filter lirik", note: lyricPreference, icon: Filter },
            { key: "noise", title: "Noise cancellation", note: "aktif saat headset tersambung", icon: Headphones },
            { key: "offline", title: "Offline fallback", note: autoDownload ? "download otomatis aktif" : "manual download", icon: WifiOff },
          ].map((item) => (
            <ToggleCard
              key={item.key}
              icon={item.icon}
              title={item.title}
              note={item.note}
              enabled={filters[item.key]}
              onClick={() => {
                setFilters((prev) => ({ ...prev, [item.key]: !prev[item.key] }));
                if (item.key === "offline") setAutoDownload((prev) => !prev);
              }}
            />
          ))}
        </div>
      </div>

      <div className="absolute bottom-[104px] left-5 right-5 z-20 grid grid-cols-2 gap-3">
        <PrimaryAction variant="secondary" icon={Save} onClick={() => savePreset("home")}>
          Simpan
        </PrimaryAction>
        <PrimaryAction icon={Play} onClick={() => startSession()}>
          Mulai
        </PrimaryAction>
      </div>
    </AppPage>
  );
}
