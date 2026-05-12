"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  contextOptions,
  durationOptions,
  focusActivities,
  initialPlaylistTracks,
  initialQueueTracks,
  lyricOptions,
  playlists,
  sessionSummary,
  songCatalog,
} from "../data.js";
import { DEFAULT_SCREEN, getScreenFromPathname, getScreenPath, isValidScreen } from "../routes.js";
import { clamp, formatClock, formatDurationLabel } from "../lib/format.js";
import {
  buildQueueInsights,
  createSessionState,
  initialFilters,
  initialFocusStats,
  normalizeFocusStats,
  normalizeSessionState,
  rankPlaylistsByFit,
  scoreTrackForFocus,
} from "../lib/session.js";

const PrototypeContext = createContext(null);
const PROTOTYPE_STORAGE_KEY = "focustunes.prototype.state";
const TOAST_TIMEOUT_MS = 2600;
const REPEAT_MODES = ["off", "all", "one"];

function getTrackPreferenceKey(track = {}) {
  return track.songId ?? track.id ?? `${track.title ?? "track"}-${track.artist ?? "unknown"}`;
}

function shuffleTrackList(trackList = []) {
  if (trackList.length <= 2) {
    return trackList;
  }

  const [currentTrack, ...restTracks] = trackList;
  const shuffledTracks = [...restTracks];

  for (let index = shuffledTracks.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledTracks[index], shuffledTracks[randomIndex]] = [shuffledTracks[randomIndex], shuffledTracks[index]];
  }

  return [currentTrack, ...shuffledTracks];
}

export function PrototypeProvider({ children, initialScreen = DEFAULT_SCREEN }) {
  const router = useRouter();
  const pathname = usePathname();
  const [screen, setScreenState] = useState(() => getScreenFromPathname(pathname) ?? initialScreen);
  const [activity, setActivity] = useState("Coding");
  const [selectedActivities, setSelectedActivities] = useState(["Coding", "Writing", "Study"]);
  const [selectedContext, setSelectedContext] = useState("Kafe");
  const [lyricPreference, setLyricPreference] = useState("Tanpa lirik");
  const [focusDuration, setFocusDuration] = useState(45);
  const [autoDownload, setAutoDownload] = useState(true);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("coding-flow");
  const [selectedPlaylistDetailId, setSelectedPlaylistDetailId] = useState("coding-flow");
  const [musicSearchOpen, setMusicSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [musicSearchMode, setMusicSearchMode] = useState("playlist");
  const [selectedSongId, setSelectedSongId] = useState("od-night-changes");
  const [selectedTargetPlaylistId, setSelectedTargetPlaylistId] = useState("coding-flow");
  const [playlistTracks, setPlaylistTracks] = useState(initialPlaylistTracks);
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const [likedTracks, setLikedTracks] = useState([]);
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(false);
  const [repeatMode, setRepeatMode] = useState("off");
  const [isSessionPaused, setIsSessionPaused] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(62);
  const [queueList, setQueueList] = useState(initialQueueTracks);
  const [blockedTracks, setBlockedTracks] = useState(["City Lyrics Loop", "Paper Deadline"]);
  const [filters, setFilters] = useState(initialFilters);
  const [focusStats, setFocusStats] = useState(initialFocusStats);
  const [sessionState, setSessionState] = useState(() => createSessionState(45));
  const [toast, setToast] = useState(null);

  const setScreen = useCallback(
    (nextScreen) => {
      if (!isValidScreen(nextScreen)) return;

      setScreenState(nextScreen);
      router.push(getScreenPath(nextScreen));
    },
    [router]
  );

  const showToast = useCallback((title, description) => {
    setToast({
      id: Date.now(),
      title,
      description,
    });
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => {
      setToast((current) => (current?.id === toast.id ? null : current));
    }, TOAST_TIMEOUT_MS);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    const routeScreen = getScreenFromPathname(pathname);
    if (routeScreen && routeScreen !== screen) {
      setScreenState(routeScreen);
    }
  }, [pathname, screen]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(PROTOTYPE_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      const nextFocusDuration = durationOptions.includes(parsed.focusDuration) ? parsed.focusDuration : 45;
      const availableContexts = new Set(contextOptions.map((item) => item.id));
      const availableActivities = new Set(Object.keys(focusActivities));
      const availablePlaylists = new Set(playlists.map((item) => item.id));
      const availableSongs = new Set(songCatalog.map((item) => item.id));

      if (availableActivities.has(parsed.activity)) setActivity(parsed.activity);
      if (Array.isArray(parsed.selectedActivities)) {
        const nextActivities = parsed.selectedActivities.filter((item) => availableActivities.has(item));
        if (nextActivities.length > 0) setSelectedActivities(nextActivities);
      }
      if (availableContexts.has(parsed.selectedContext)) setSelectedContext(parsed.selectedContext);
      if (lyricOptions.includes(parsed.lyricPreference)) setLyricPreference(parsed.lyricPreference);
      setFocusDuration(nextFocusDuration);
      if (typeof parsed.autoDownload === "boolean") setAutoDownload(parsed.autoDownload);
      if (availablePlaylists.has(parsed.selectedPlaylistId)) setSelectedPlaylistId(parsed.selectedPlaylistId);
      if (availablePlaylists.has(parsed.selectedPlaylistDetailId)) setSelectedPlaylistDetailId(parsed.selectedPlaylistDetailId);
      if (typeof parsed.musicSearchOpen === "boolean") setMusicSearchOpen(parsed.musicSearchOpen);
      if (typeof parsed.searchQuery === "string") setSearchQuery(parsed.searchQuery);
      if (["playlist", "song", "artist"].includes(parsed.musicSearchMode)) setMusicSearchMode(parsed.musicSearchMode);
      if (availableSongs.has(parsed.selectedSongId)) setSelectedSongId(parsed.selectedSongId);
      if (availablePlaylists.has(parsed.selectedTargetPlaylistId)) setSelectedTargetPlaylistId(parsed.selectedTargetPlaylistId);
      if (parsed.playlistTracks && typeof parsed.playlistTracks === "object") {
        setPlaylistTracks({ ...initialPlaylistTracks, ...parsed.playlistTracks });
      }
      if (typeof parsed.isMusicPlaying === "boolean") setIsMusicPlaying(parsed.isMusicPlaying);
      if (Array.isArray(parsed.likedTracks)) setLikedTracks(parsed.likedTracks.filter((item) => typeof item === "string"));
      if (typeof parsed.isShuffleEnabled === "boolean") setIsShuffleEnabled(parsed.isShuffleEnabled);
      if (REPEAT_MODES.includes(parsed.repeatMode)) setRepeatMode(parsed.repeatMode);
      if (typeof parsed.isSessionPaused === "boolean") setIsSessionPaused(parsed.isSessionPaused);
      if (typeof parsed.volumeLevel === "number") setVolumeLevel(clamp(parsed.volumeLevel, 20, 90));
      if (Array.isArray(parsed.queueList)) setQueueList(parsed.queueList);
      if (Array.isArray(parsed.blockedTracks)) setBlockedTracks(parsed.blockedTracks);
      if (parsed.filters && typeof parsed.filters === "object") setFilters({ ...initialFilters, ...parsed.filters });
      if (parsed.focusStats) setFocusStats(normalizeFocusStats(parsed.focusStats));
      if (parsed.sessionState) setSessionState(normalizeSessionState(parsed.sessionState, nextFocusDuration));
    } catch (error) {
      console.error("Failed to restore FocusTunes prototype state", error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const payload = {
      activity,
      selectedActivities,
      selectedContext,
      lyricPreference,
      focusDuration,
      autoDownload,
      selectedPlaylistId,
      selectedPlaylistDetailId,
      musicSearchOpen,
      searchQuery,
      musicSearchMode,
      selectedSongId,
      selectedTargetPlaylistId,
      playlistTracks,
      isMusicPlaying,
      likedTracks,
      isShuffleEnabled,
      repeatMode,
      isSessionPaused,
      volumeLevel,
      queueList,
      blockedTracks,
      filters,
      focusStats,
      sessionState,
    };

    window.localStorage.setItem(PROTOTYPE_STORAGE_KEY, JSON.stringify(payload));
  }, [
    activity,
    selectedActivities,
    selectedContext,
    lyricPreference,
    focusDuration,
    autoDownload,
    selectedPlaylistId,
    selectedPlaylistDetailId,
    musicSearchOpen,
    searchQuery,
    musicSearchMode,
    selectedSongId,
    selectedTargetPlaylistId,
    playlistTracks,
    isMusicPlaying,
    likedTracks,
    isShuffleEnabled,
    repeatMode,
    isSessionPaused,
    volumeLevel,
    queueList,
    blockedTracks,
    filters,
    focusStats,
    sessionState,
  ]);

  useEffect(() => {
    setSessionState((previous) => (previous.hasStarted ? previous : createSessionState(focusDuration, { setupSeconds: previous.setupSeconds })));
  }, [focusDuration]);

  useEffect(() => {
    if (!sessionState.hasStarted || isSessionPaused || !sessionState.isActive) return;

    const interval = window.setInterval(() => {
      setSessionState((previous) => {
        if (!previous.hasStarted || !previous.isActive) return previous;
        if (previous.remainingSeconds <= 1) {
          return {
            ...previous,
            remainingSeconds: 0,
            isActive: false,
          };
        }

        return {
          ...previous,
          remainingSeconds: previous.remainingSeconds - 1,
        };
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [sessionState.hasStarted, sessionState.isActive, isSessionPaused]);

  const selectedPlaylist = useMemo(
    () => playlists.find((item) => item.id === selectedPlaylistId) ?? playlists[0],
    [selectedPlaylistId]
  );

  const selectedPlaylistDetail = useMemo(
    () => playlists.find((item) => item.id === selectedPlaylistDetailId) ?? selectedPlaylist,
    [selectedPlaylistDetailId, selectedPlaylist]
  );

  const selectedSong = useMemo(
    () => songCatalog.find((item) => item.id === selectedSongId) ?? songCatalog[0],
    [selectedSongId]
  );

  const currentTrack = useMemo(() => queueList[0] ?? initialQueueTracks[0], [queueList]);
  const isCurrentTrackLiked = useMemo(() => likedTracks.includes(getTrackPreferenceKey(currentTrack)), [likedTracks, currentTrack]);

  const queueInsights = useMemo(
    () => buildQueueInsights(queueList, blockedTracks, focusDuration, autoDownload),
    [queueList, blockedTracks, focusDuration, autoDownload]
  );

  const recommendedPlaylists = useMemo(
    () =>
      rankPlaylistsByFit(playlists, {
        activity,
        selectedContext,
        lyricPreference,
        focusDuration,
        autoDownload,
        playlistTracks,
        blockedTracks,
      }),
    [activity, selectedContext, lyricPreference, focusDuration, autoDownload, playlistTracks, blockedTracks]
  );

  const sessionProgress = useMemo(() => {
    if (!sessionState.hasStarted) return 0;
    return clamp((sessionState.totalSeconds - sessionState.remainingSeconds) / Math.max(1, sessionState.totalSeconds), 0, 1);
  }, [sessionState.hasStarted, sessionState.remainingSeconds, sessionState.totalSeconds]);

  const sessionSummaryData = useMemo(
    () => ({
      completionRate: clamp(Math.round(sessionProgress * 100), 0, 100),
      remainingLabel: formatClock(sessionState.remainingSeconds),
      elapsedLabel: formatClock(sessionState.totalSeconds - sessionState.remainingSeconds),
    }),
    [sessionProgress, sessionState.remainingSeconds, sessionState.totalSeconds]
  );

  const finishSession = useCallback(
    (reason = "manual") => {
      if (!sessionState.hasStarted) {
        showToast("Session belum dimulai", "Mulai sesi dulu agar metrik bisa dihitung.");
        return;
      }

      const elapsedSeconds = Math.max(60, sessionState.totalSeconds - sessionState.remainingSeconds);
      const durationMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
      const offlineRate = Math.round((queueInsights.offlineCount / Math.max(1, queueList.length)) * 100);
      const blockedSuggestion =
        queueList.find((track) => track.distracting || blockedTracks.includes(track.title) || track.focusSafe === false)?.title ??
        sessionSummary.blockedSuggestion;
      const completionRate = clamp(Math.round((elapsedSeconds / Math.max(1, sessionState.totalSeconds)) * 100), 4, 100);
      const nextSummary = {
        duration: formatDurationLabel(durationMinutes),
        durationMinutes,
        skipCount: sessionState.skipCount,
        blockedSuggestion,
        savedSetup: selectedPlaylist.title,
        completionRate,
        setupSeconds: sessionState.setupSeconds,
      };

      setFocusStats((previous) => {
        const nextCompletedSessions = previous.completedSessions + 1;
        const nextOfflineSuccessRate = Math.round(
          (previous.offlineSuccessRate * previous.completedSessions + offlineRate) / nextCompletedSessions
        );
        const nextDistractionDelta = clamp(
          Math.round((previous.distractionDelta * previous.completedSessions + (sessionState.skipCount <= 1 ? -36 : -18 + sessionState.skipCount * 3)) / nextCompletedSessions),
          -60,
          24
        );

        return {
          ...previous,
          completedSessions: nextCompletedSessions,
          streakDays: previous.streakDays + (completionRate >= 70 ? 1 : 0),
          totalFocusMinutes: previous.totalFocusMinutes + durationMinutes,
          offlineSuccessRate: nextOfflineSuccessRate,
          distractionDelta: nextDistractionDelta,
          activityMinutes: {
            ...previous.activityMinutes,
            [activity]: (previous.activityMinutes[activity] ?? 0) + durationMinutes,
          },
          lastSessionSummary: nextSummary,
        };
      });

      setIsSessionPaused(false);
      setSessionState(createSessionState(focusDuration));
      setScreen("review");
      showToast(reason === "timer" ? "Sesi selesai otomatis" : "Sesi tersimpan", `${nextSummary.duration} masuk ke statistik.`);
    },
    [
      sessionState,
      queueInsights.offlineCount,
      queueList,
      blockedTracks,
      selectedPlaylist.title,
      activity,
      focusDuration,
      setScreen,
      showToast,
    ]
  );

  useEffect(() => {
    if (sessionState.hasStarted && !sessionState.isActive && sessionState.remainingSeconds === 0) {
      finishSession("timer");
    }
  }, [sessionState.hasStarted, sessionState.isActive, sessionState.remainingSeconds, finishSession]);

  const startSession = useCallback(
    (options = {}) => {
      if (queueList.length === 0) {
        showToast("Queue kosong", "Tambahkan lagu atau playlist dulu.");
        setScreen("queue");
        return;
      }

      const nextActivity = options.activityLabel ?? activity;
      const nextDuration = options.duration ?? focusDuration;
      const setupSeconds = clamp(22 - selectedActivities.length * 2 - (autoDownload ? 4 : 0) - (filters.lyrics ? 2 : 0), 7, 22);

      setIsSessionPaused(false);
      setSessionState(
        createSessionState(nextDuration, {
          hasStarted: true,
          isActive: true,
          setupSeconds,
          initialQueueSize: queueList.length,
        })
      );
      setScreen(options.screen ?? "session");
      showToast("Sesi dimulai", `${nextActivity} mode • ${nextDuration} menit`);
    },
    [queueList.length, showToast, setScreen, activity, focusDuration, selectedActivities.length, autoDownload, filters.lyrics]
  );

  const toggleSessionPause = useCallback(() => {
    if (!sessionState.hasStarted) {
      startSession();
      return;
    }

    setIsSessionPaused((previous) => {
      const next = !previous;
      showToast(next ? "Session dipause" : "Session dilanjutkan", next ? "Timer berhenti sementara." : "Focus flow aktif kembali.");
      return next;
    });
  }, [sessionState.hasStarted, startSession, showToast]);

  const savePreset = useCallback(
    (nextScreen = "home") => {
      setFocusStats((previous) => ({
        ...previous,
        savedPresets: previous.savedPresets + 1,
        lastSessionSummary: {
          ...previous.lastSessionSummary,
          savedSetup: selectedPlaylist.title,
        },
      }));
      showToast("Preset disimpan", `${selectedPlaylist.title} siap dipakai lagi.`);
      if (nextScreen) setScreen(nextScreen);
    },
    [selectedPlaylist.title, setScreen, showToast]
  );

  const smartQueue = useCallback(() => {
    setQueueList((previous) => {
      const seen = new Set();
      const deduplicated = previous.filter((track) => {
        const key = track.songId ?? `${track.title}-${track.artist}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      return deduplicated
        .map((track, index) => ({ track, index }))
        .sort((left, right) => scoreTrackForFocus(right.track, blockedTracks) - scoreTrackForFocus(left.track, blockedTracks) || left.index - right.index)
        .map(({ track }) =>
          blockedTracks.includes(track.title)
            ? {
                ...track,
                distracting: true,
              }
            : track
        );
    });
    showToast("Queue dirapikan", "Lagu fokus-safe dan offline diprioritaskan.");
  }, [blockedTracks, showToast]);

  const rotateQueue = useCallback(
    (direction = "next") => {
      setQueueList((previous) => {
        if (previous.length <= 1) return previous;

        if (direction === "previous") {
          const lastTrack = previous[previous.length - 1];
          return [lastTrack, ...previous.slice(0, -1)];
        }

        const [firstTrack, ...rest] = previous;
        return [...rest, firstTrack];
      });
    },
    []
  );

  const toggleLikedTrack = useCallback(
    (track = currentTrack) => {
      if (!track) return;

      const trackKey = getTrackPreferenceKey(track);
      let isSaved = false;

      setLikedTracks((previous) => {
        if (previous.includes(trackKey)) {
          return previous.filter((item) => item !== trackKey);
        }

        isSaved = true;
        return [...previous, trackKey];
      });

      showToast(
        isSaved ? "Masuk favorit" : "Dihapus dari favorit",
        isSaved ? `${track.title} disimpan untuk diputar lagi.` : `${track.title} dihapus dari daftar favorit.`
      );
    },
    [currentTrack, showToast]
  );

  const toggleShuffleMode = useCallback(() => {
    let nextIsEnabled = false;

    setIsShuffleEnabled((previous) => {
      nextIsEnabled = !previous;
      return nextIsEnabled;
    });

    if (nextIsEnabled) {
      setQueueList((previous) => shuffleTrackList(previous));
    }

    showToast(
      nextIsEnabled ? "Mode acak aktif" : "Mode acak nonaktif",
      nextIsEnabled ? "Urutan antrean diacak untuk menjaga variasi fokus." : "Urutan antrean kembali mengikuti susunan saat ini."
    );
  }, [showToast]);

  const cycleRepeatMode = useCallback(() => {
    let nextMode = "all";

    setRepeatMode((previous) => {
      nextMode = previous === "off" ? "all" : previous === "all" ? "one" : "off";
      return nextMode;
    });

    const modeMessages = {
      off: {
        title: "Ulangi nonaktif",
        description: "Track akan berjalan mengikuti antrean tanpa mode ulang.",
      },
      all: {
        title: "Ulangi playlist aktif",
        description: "Antrean fokus akan terus berputar selama sesi berjalan.",
      },
      one: {
        title: "Ulangi satu lagu aktif",
        description: "Track saat ini akan dipertahankan saat Anda menekan skip.",
      },
    };

    showToast(modeMessages[nextMode].title, modeMessages[nextMode].description);
  }, [showToast]);

  const shareCurrentTrack = useCallback(
    async (track = currentTrack) => {
      if (!track) return;

      const shareSummary = `Sedang memutar ${track.title} - ${track.artist} di FocusTunes.`;

      try {
        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(shareSummary);
          showToast("Track siap dibagikan", "Ringkasan lagu disalin ke clipboard.");
          return;
        }
      } catch (error) {
        console.error("Failed to copy track summary", error);
      }

      showToast("Track siap dibagikan", shareSummary);
    },
    [currentTrack, showToast]
  );

  const skipCurrentTrack = useCallback(() => {
    if (repeatMode === "one") {
      setSessionState((previous) =>
        previous.hasStarted
          ? {
              ...previous,
              skipCount: previous.skipCount + 1,
            }
          : previous
      );
      showToast("Mode ulangi satu lagu aktif", "Track saat ini tetap diputar sesuai preferensi repeat.");
      return;
    }

    rotateQueue("next");
    setSessionState((previous) =>
      previous.hasStarted
        ? {
            ...previous,
            skipCount: previous.skipCount + 1,
          }
        : previous
    );
    showToast("Track dilewati", "Queue menyesuaikan mood fokus.");
  }, [repeatMode, rotateQueue, showToast]);

  const value = useMemo(
    () => ({
      screen,
      setScreen,
      activity,
      setActivity,
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
      selectedPlaylistId,
      setSelectedPlaylistId,
      selectedPlaylist,
      selectedPlaylistDetailId,
      setSelectedPlaylistDetailId,
      selectedPlaylistDetail,
      musicSearchOpen,
      setMusicSearchOpen,
      searchQuery,
      setSearchQuery,
      musicSearchMode,
      setMusicSearchMode,
      selectedSongId,
      setSelectedSongId,
      selectedSong,
      selectedTargetPlaylistId,
      setSelectedTargetPlaylistId,
      playlistTracks,
      setPlaylistTracks,
      isMusicPlaying,
      setIsMusicPlaying,
      likedTracks,
      isCurrentTrackLiked,
      isShuffleEnabled,
      repeatMode,
      isSessionPaused,
      setIsSessionPaused,
      volumeLevel,
      setVolumeLevel,
      queueList,
      setQueueList,
      blockedTracks,
      setBlockedTracks,
      filters,
      setFilters,
      focusStats,
      sessionState,
      sessionProgress,
      sessionSummaryData,
      currentTrack,
      queueInsights,
      recommendedPlaylists,
      toast,
      showToast,
      startSession,
      toggleSessionPause,
      finishSession,
      savePreset,
      smartQueue,
      rotateQueue,
      toggleLikedTrack,
      toggleShuffleMode,
      cycleRepeatMode,
      shareCurrentTrack,
      skipCurrentTrack,
    }),
    [
      screen,
      setScreen,
      activity,
      selectedActivities,
      selectedContext,
      lyricPreference,
      focusDuration,
      autoDownload,
      selectedPlaylistId,
      selectedPlaylist,
      selectedPlaylistDetailId,
      selectedPlaylistDetail,
      musicSearchOpen,
      searchQuery,
      musicSearchMode,
      selectedSongId,
      selectedSong,
      selectedTargetPlaylistId,
      playlistTracks,
      isMusicPlaying,
      likedTracks,
      isCurrentTrackLiked,
      isShuffleEnabled,
      repeatMode,
      isSessionPaused,
      volumeLevel,
      queueList,
      blockedTracks,
      filters,
      focusStats,
      sessionState,
      sessionProgress,
      sessionSummaryData,
      currentTrack,
      queueInsights,
      recommendedPlaylists,
      toast,
      showToast,
      startSession,
      toggleSessionPause,
      finishSession,
      savePreset,
      smartQueue,
      rotateQueue,
      toggleLikedTrack,
      toggleShuffleMode,
      cycleRepeatMode,
      shareCurrentTrack,
      skipCurrentTrack,
    ]
  );

  return <PrototypeContext.Provider value={value}>{children}</PrototypeContext.Provider>;
}

export function usePrototype() {
  const context = useContext(PrototypeContext);
  if (!context) {
    throw new Error("usePrototype must be used inside PrototypeProvider");
  }
  return context;
}
