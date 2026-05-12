import { ChevronRight, ListOrdered, Music4, Plus, Search, UserCircle2, X } from "lucide-react";

import { playlists, songCatalog } from "../../data.js";
import { usePrototype } from "../../context/PrototypeProvider.jsx";
import { AppPage, TopTabs } from "../../components/layout/index.js";
import { MiniStat, PlaylistCard, SectionTitle } from "../../components/ui/index.js";
import { cx } from "../../lib/format.js";

export function MusicScreen() {
  const {
    musicSearchOpen,
    setMusicSearchOpen,
    searchQuery,
    setSearchQuery,
    musicSearchMode,
    setMusicSearchMode,
    selectedPlaylistDetail,
    setSelectedPlaylistDetailId,
    selectedPlaylistId,
    setSelectedPlaylistId,
    selectedSong,
    setSelectedSongId,
    selectedTargetPlaylistId,
    setSelectedTargetPlaylistId,
    playlistTracks,
    setPlaylistTracks,
    setActivity,
    setQueueList,
    setAutoDownload,
    recommendedPlaylists,
    startSession,
    showToast,
  } = usePrototype();
  const hasQuery = searchQuery.trim().length > 0;
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visiblePlaylists = hasQuery
    ? recommendedPlaylists.filter((item) =>
        `${item.title} ${item.subtitle} ${item.activity} ${item.context} ${item.tags.join(" ")}`.toLowerCase().includes(normalizedQuery)
      )
    : recommendedPlaylists;
  const visibleSongs = hasQuery
    ? songCatalog.filter((item) =>
        `${item.title} ${item.artist} ${item.album} ${item.mood} ${item.activityFit}`.toLowerCase().includes(normalizedQuery)
      )
    : [...songCatalog].sort((left, right) => Number(right.focusSafe) - Number(left.focusSafe));
  const artistGroups = visibleSongs.reduce((groups, song) => {
    groups[song.artist] = groups[song.artist] ? [...groups[song.artist], song] : [song];
    return groups;
  }, {});
  const detailedPlaylist = visiblePlaylists.find((item) => item.id === selectedPlaylistDetail.id) ?? recommendedPlaylists.find((item) => item.id === selectedPlaylistDetail.id) ?? selectedPlaylistDetail;
  const searchCopy = {
    playlist: {
      title: "Cari playlist fokus",
      helper: "Aktivitas, suasana, atau filter lirik",
      placeholder: "Contoh: coding, hujan, offline",
    },
    song: {
      title: "Cari lagu atau artist",
      helper: "Tambah lagu ke playlist fokus tertentu",
      placeholder: "Cari Taylor Swift, One Direction, atau judul lagu",
    },
    artist: {
      title: "Cari berdasarkan artist",
      helper: "Lihat lagu yang cocok untuk playlist fokus",
      placeholder: "Cari Taylor Swift, One Direction, Coldplay",
    },
  }[musicSearchMode];

  function usePlaylist(item) {
    setSelectedPlaylistId(item.id);
    setSelectedPlaylistDetailId(item.id);
    setActivity(item.activity);
    startSession({ activityLabel: item.activity });
  }

  function addPlaylistTrack(item) {
    setQueueList((prev) => [
      ...prev,
      {
        id: `${item.id}-${prev.length}`,
        title: item.title,
        artist: "FocusTunes Mix",
        length: "4:00",
        offline: item.offline,
        focusSafe: item.lyric === "Tanpa lirik",
      },
    ]);
    setSelectedPlaylistDetailId(item.id);
    showToast("Masuk ke queue", `${item.title} ditambahkan ke sesi fokus.`);
  }

  function addSongToQueue(song) {
    setQueueList((prev) => [
      ...prev,
      {
        id: `song-${song.id}-${prev.length}`,
        title: song.title,
        artist: song.artist,
        length: song.length,
        offline: song.offline,
        songId: song.id,
        focusSafe: song.focusSafe,
        lyric: song.lyric,
      },
    ]);
    setSelectedSongId(song.id);
    showToast("Lagu ditambahkan", `${song.title} masuk ke smart queue.`);
  }

  function addSongToPlaylist(song, playlistId = selectedTargetPlaylistId) {
    const alreadyAdded = (playlistTracks[playlistId] ?? []).includes(song.id);
    setPlaylistTracks((prev) => {
      const current = prev[playlistId] ?? [];
      if (current.includes(song.id)) return prev;
      return { ...prev, [playlistId]: [...current, song.id] };
    });
    setSelectedSongId(song.id);
    if (playlistId === selectedPlaylistId) {
      addSongToQueue(song);
      return;
    }
    showToast(alreadyAdded ? "Sudah ada di playlist" : "Masuk ke playlist", `${song.title} ${alreadyAdded ? "tetap tersimpan" : "ditambahkan"} ke playlist target.`);
  }

  return (
    <AppPage>
      <div className="h-full overflow-y-auto px-5 pb-44 pt-3">
        <TopTabs />

        <div className="mt-5">
          <div className="text-[28px] font-black tracking-tight text-[#082B5C]">Music</div>
          <div className="text-sm leading-6 text-slate-500">Cari, pilih, dan simpan playlist yang sesuai dengan mode fokusmu.</div>
        </div>

        <div className="mt-4 rounded-[26px] border border-[#CFE6EC] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#ECF7F8] text-[#1C9AA0]">
              <Search className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[#082B5C]">{searchCopy.title}</div>
              <div className="truncate text-xs text-slate-500">{searchCopy.helper}</div>
            </div>
          </div>

          <SearchModeTabs
            mode={musicSearchMode}
            onChange={(mode) => {
              setMusicSearchMode(mode);
              setMusicSearchOpen(true);
            }}
          />

          {musicSearchOpen ? (
            <div className="mt-4">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={searchCopy.placeholder}
                  className="w-full bg-transparent text-sm text-[#082B5C] outline-none placeholder:text-slate-400"
                />
                <button
                  onClick={() => {
                    setMusicSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="text-slate-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setMusicSearchOpen(true)}
              className="mt-4 flex w-full items-center justify-between rounded-2xl bg-[#082B5C] px-4 py-3 text-left text-white"
            >
              <span className="text-sm font-semibold">Mulai cari</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-5 rounded-[28px] bg-[linear-gradient(135deg,#082B5C_0%,#0C4B72_60%,#1C9AA0_100%)] p-5 text-white shadow-lg">
          {musicSearchMode === "playlist" ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">Playlist detail</div>
                <div className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                  {detailedPlaylist.match}% fit
                </div>
              </div>
              <div className="mt-2 text-2xl font-black tracking-tight">{detailedPlaylist.title}</div>
              <p className="mt-2 text-sm leading-6 text-cyan-50/90">{detailedPlaylist.subtitle}</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-cyan-100/85">{detailedPlaylist.insight}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <MiniStat label="Durasi" value={`${detailedPlaylist.duration}m`} />
                <MiniStat label="Lirik" value={detailedPlaylist.lyric === "Tanpa lirik" ? "Low" : "Mix"} />
                <MiniStat label="Lagu" value={`${playlistTracks[detailedPlaylist.id]?.length ?? 0}`} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <button onClick={() => usePlaylist(detailedPlaylist)} className="rounded-2xl bg-white px-3 py-3 text-xs font-black text-[#082B5C]">
                  Pakai
                </button>
                <button onClick={() => addPlaylistTrack(detailedPlaylist)} className="rounded-2xl bg-white/10 px-3 py-3 text-xs font-bold text-white ring-1 ring-white/15">
                  Queue
                </button>
                <button
                  onClick={() => {
                    setAutoDownload(true);
                    showToast("Offline aktif", `${detailedPlaylist.title} disiapkan untuk fallback.`);
                  }}
                  className="rounded-2xl bg-white/10 px-3 py-3 text-xs font-bold text-white ring-1 ring-white/15"
                >
                  Offline
                </button>
              </div>
            </>
          ) : (
            <SongDetailPanel
              song={selectedSong}
              targetPlaylistId={selectedTargetPlaylistId}
              onTargetChange={setSelectedTargetPlaylistId}
              playlistTracks={playlistTracks}
              onAddToQueue={() => addSongToQueue(selectedSong)}
              onAddToPlaylist={() => addSongToPlaylist(selectedSong)}
            />
          )}
        </div>

        <div className="mt-6">
          {musicSearchMode === "playlist" ? (
            <>
              <SectionTitle title={hasQuery ? "Hasil pencarian playlist" : "Playlist berbasis aktivitas"} />
              <div className="mt-3 grid grid-cols-2 gap-3">
                {visiblePlaylists.map((item) => (
                  <PlaylistCard
                    key={item.id}
                    playlist={item}
                    match={item.match}
                    insight={item.insight}
                    selected={item.id === selectedPlaylistDetail.id}
                    onClick={() => setSelectedPlaylistDetailId(item.id)}
                    onUse={() => usePlaylist(item)}
                    onQueue={() => addPlaylistTrack(item)}
                    onOffline={() => {
                      setAutoDownload(true);
                      showToast("Offline aktif", `${item.title} akan diprioritaskan saat koneksi lemah.`);
                    }}
                  />
                ))}
              </div>
            </>
          ) : null}

          {musicSearchMode === "song" ? (
            <>
              <SectionTitle title={hasQuery ? "Hasil pencarian lagu" : "Lagu rekomendasi"} />
              <div className="mt-3 space-y-3">
                {visibleSongs.map((song) => (
                  <SongResultRow
                    key={song.id}
                    song={song}
                    selected={song.id === selectedSong.id}
                    onSelect={() => setSelectedSongId(song.id)}
                    onAddToQueue={() => addSongToQueue(song)}
                    onAddToPlaylist={() => addSongToPlaylist(song)}
                  />
                ))}
              </div>
            </>
          ) : null}

          {musicSearchMode === "artist" ? (
            <>
              <SectionTitle title={hasQuery ? "Hasil pencarian artist" : "Artist populer untuk mock demo"} />
              <div className="mt-3 space-y-3">
                {Object.entries(artistGroups).map(([artist, songs]) => (
                  <ArtistResultGroup
                    key={artist}
                    artist={artist}
                    songs={songs}
                    selectedSongId={selectedSong.id}
                    onSelectSong={(song) => setSelectedSongId(song.id)}
                    onAddToQueue={addSongToQueue}
                    onAddToPlaylist={addSongToPlaylist}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </AppPage>
  );
}

function SearchModeTabs({ mode, onChange }) {
  const items = [
    { key: "playlist", label: "Playlist" },
    { key: "song", label: "Lagu" },
    { key: "artist", label: "Artist" },
  ];

  return (
    <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-1 ring-1 ring-slate-100">
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={cx(
            "rounded-xl px-2 py-2 text-xs font-bold transition",
            mode === item.key ? "bg-[#082B5C] text-white shadow-sm" : "text-slate-500"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function SongDetailPanel({ song, targetPlaylistId, onTargetChange, playlistTracks, onAddToQueue, onAddToPlaylist }) {
  const targetPlaylist = playlists.find((item) => item.id === targetPlaylistId) ?? playlists[0];
  const alreadyAdded = (playlistTracks[targetPlaylistId] ?? []).includes(song.id);

  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">Song detail</div>
      <div className="mt-2 text-2xl font-black tracking-tight">{song.title}</div>
      <p className="mt-1 text-sm text-cyan-50/90">
        {song.artist} - {song.album}
      </p>
      <p className="mt-2 text-sm leading-6 text-cyan-50/80">
        {song.mood}. Cocok untuk {song.activityFit.toLowerCase()} mode, dengan status lirik {song.lyric}.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <MiniStat label="Durasi" value={song.length} />
        <MiniStat label="Focus" value={song.focusSafe ? "Safe" : "Review"} />
        <MiniStat label="Offline" value={song.offline ? "Ready" : "Need"} />
      </div>

      <TargetPlaylistSelector value={targetPlaylistId} onChange={onTargetChange} playlistTracks={playlistTracks} />

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button onClick={onAddToQueue} className="rounded-2xl bg-white px-3 py-3 text-xs font-black text-[#082B5C]">
          Tambah ke queue
        </button>
        <button onClick={onAddToPlaylist} className="rounded-2xl bg-white/10 px-3 py-3 text-xs font-bold text-white ring-1 ring-white/15">
          {alreadyAdded ? "Sudah di playlist" : `Tambah ke ${targetPlaylist.title.split(" ")[0]}`}
        </button>
      </div>

      {!song.focusSafe ? (
        <div className="mt-3 rounded-2xl bg-white/10 px-3 py-2 text-xs leading-5 text-cyan-50 ring-1 ring-white/15">
          Lagu ini punya lirik/energi tinggi. Cocok untuk break, ride, atau queue non-strict.
        </div>
      ) : null}
    </div>
  );
}

function TargetPlaylistSelector({ value, onChange, playlistTracks }) {
  return (
    <div className="mt-4">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100">Target playlist</div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {playlists.map((item) => {
          const active = value === item.id;
          const count = playlistTracks[item.id]?.length ?? 0;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={cx(
                "min-w-[132px] rounded-2xl border px-3 py-3 text-left transition",
                active ? "border-white bg-white text-[#082B5C]" : "border-white/15 bg-white/10 text-white"
              )}
            >
              <span className="block truncate text-xs font-black">{item.title}</span>
              <span className={cx("mt-1 block text-[10px]", active ? "text-slate-500" : "text-cyan-100/80")}>{count} lagu tambahan</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SongResultRow({ song, selected, onSelect, onAddToQueue, onAddToPlaylist }) {
  return (
    <div className={cx("rounded-[22px] bg-white p-3 shadow-sm ring-1", selected ? "ring-[#1C9AA0]" : "ring-slate-100")}>
      <button onClick={onSelect} className="flex w-full items-center gap-3 text-left">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#DFF7FB_0%,#EEF4FF_100%)] text-[#082B5C]">
          <Music4 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-black text-[#082B5C]">{song.title}</div>
          <div className="truncate text-xs text-slate-500">
            {song.artist} - {song.album}
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            <SongBadge>{song.length}</SongBadge>
            <SongBadge>{song.activityFit}</SongBadge>
            <SongBadge tone={song.focusSafe ? "safe" : "warn"}>{song.focusSafe ? "Focus safe" : "Review"}</SongBadge>
          </div>
        </div>
      </button>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={onAddToQueue} className="rounded-xl bg-[#ECF7F8] px-3 py-2 text-xs font-bold text-[#1C9AA0]">
          Queue
        </button>
        <button onClick={onAddToPlaylist} className="rounded-xl bg-[#082B5C] px-3 py-2 text-xs font-bold text-white">
          Playlist
        </button>
      </div>
    </div>
  );
}

function ArtistResultGroup({ artist, songs, selectedSongId, onSelectSong, onAddToQueue, onAddToPlaylist }) {
  const safeCount = songs.filter((song) => song.focusSafe).length;

  return (
    <div className="rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#ECF7F8] text-[#1C9AA0]">
          <UserCircle2 className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-black text-[#082B5C]">{artist}</div>
          <div className="text-xs text-slate-500">
            {songs.length} lagu - {safeCount} focus-safe
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {songs.map((song) => (
          <div
            key={song.id}
            className={cx(
              "flex items-center gap-3 rounded-2xl px-3 py-3",
              selectedSongId === song.id ? "bg-[#ECF7F8]" : "bg-slate-50"
            )}
          >
            <button onClick={() => onSelectSong(song)} className="min-w-0 flex-1 text-left">
              <div className="truncate text-sm font-semibold text-[#082B5C]">{song.title}</div>
              <div className="truncate text-xs text-slate-500">
                {song.album} - {song.length}
              </div>
            </button>
            <button onClick={() => onAddToQueue(song)} className="grid h-8 w-8 place-items-center rounded-xl bg-white text-[#1C9AA0]">
              <Plus className="h-4 w-4" />
            </button>
            <button onClick={() => onAddToPlaylist(song)} className="grid h-8 w-8 place-items-center rounded-xl bg-[#082B5C] text-white">
              <ListOrdered className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SongBadge({ children, tone = "neutral" }) {
  return (
    <span
      className={cx(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
        tone === "safe" ? "bg-emerald-50 text-emerald-600" : tone === "warn" ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"
      )}
    >
      {children}
    </span>
  );
}
