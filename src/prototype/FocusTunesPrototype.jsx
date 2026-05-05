"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  Ban,
  ChartNoAxesColumn,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Download,
  Edit3,
  Filter,
  Headphones,
  Heart,
  House,
  ListOrdered,
  Minus,
  MoreHorizontal,
  Music4,
  Pause,
  Play,
  Plus,
  Repeat2,
  Save,
  Search,
  Settings2,
  Share2,
  ShieldCheck,
  Shuffle,
  SkipBack,
  SkipForward,
  Sparkles,
  Trash2,
  UserCircle2,
  Volume2,
  WifiOff,
  X,
} from "lucide-react";

import {
  brand,
  contextOptions,
  durationOptions,
  focusActivities,
  focusInsights,
  initialPlaylistTracks,
  initialQueueTracks,
  lyricOptions,
  playlists,
  referenceImages,
  sessionSummary,
  songCatalog,
  weeklyBars,
} from "./data.js";
import { DEFAULT_SCREEN, getScreenFromPathname, getScreenPath, isValidScreen, screenLabels } from "./routes.js";
const PrototypeContext = createContext(null);

const PROTOTYPE_STORAGE_KEY = "focustunes.prototype.state";
const TOAST_TIMEOUT_MS = 2600;
const initialFilters = {
  playlist: true,
  lyrics: true,
  noise: true,
  offline: true,
};
const initialActivityMinutes = {
  Coding: 684,
  Writing: 432,
  Study: 336,
  Ride: 144,
};
const initialFocusStats = {
  completedSessions: 26,
  streakDays: 8,
  totalFocusMinutes: 1452,
  activityMinutes: initialActivityMinutes,
  offlineSuccessRate: 97,
  distractionDelta: -31,
  savedPresets: 4,
  lastSessionSummary: {
    duration: sessionSummary.duration,
    durationMinutes: 44,
    skipCount: sessionSummary.skipCount,
    blockedSuggestion: sessionSummary.blockedSuggestion,
    savedSetup: sessionSummary.savedSetup,
    completionRate: 91,
    setupSeconds: 14,
  },
};

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function parseTrackLength(length = "0:00") {
  const [minutes = "0", seconds = "0"] = String(length).split(":");
  return Number(minutes) * 60 + Number(seconds);
}

function formatClock(totalSeconds) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatDurationLabel(totalMinutes) {
  return `${Math.max(1, Math.round(totalMinutes))} menit`;
}

function createSessionState(durationMinutes, overrides = {}) {
  const totalSeconds = Math.max(60, Number(durationMinutes) * 60);
  return {
    hasStarted: false,
    isActive: false,
    totalSeconds,
    remainingSeconds: totalSeconds,
    skipCount: 0,
    setupSeconds: 14,
    initialQueueSize: initialQueueTracks.length,
    ...overrides,
  };
}

function normalizeFocusStats(stats = {}) {
  return {
    ...initialFocusStats,
    ...stats,
    activityMinutes: {
      ...initialActivityMinutes,
      ...stats.activityMinutes,
    },
    lastSessionSummary: {
      ...initialFocusStats.lastSessionSummary,
      ...stats.lastSessionSummary,
    },
  };
}

function normalizeSessionState(rawState, durationMinutes) {
  if (!rawState || typeof rawState !== "object") {
    return createSessionState(durationMinutes);
  }

  const fallback = createSessionState(durationMinutes);
  const parsedTotalSeconds = Number(rawState.totalSeconds);
  const parsedRemainingSeconds = Number(rawState.remainingSeconds);
  const totalSeconds = Math.max(60, Number.isFinite(parsedTotalSeconds) ? parsedTotalSeconds : fallback.totalSeconds);
  return {
    ...fallback,
    ...rawState,
    totalSeconds,
    remainingSeconds: clamp(Number.isFinite(parsedRemainingSeconds) ? parsedRemainingSeconds : totalSeconds, 0, totalSeconds),
    skipCount: Math.max(0, Number(rawState.skipCount) || 0),
    setupSeconds: Math.max(5, Number(rawState.setupSeconds) || fallback.setupSeconds),
    initialQueueSize: Math.max(1, Number(rawState.initialQueueSize) || fallback.initialQueueSize),
  };
}

function scoreTrackForFocus(track, blockedTracks) {
  let score = 0;

  if (track.offline) score += 2;
  if (track.focusSafe !== false && !track.distracting) score += 2;
  if (track.lyric === "EN") score -= 1;
  if (track.distracting || blockedTracks.includes(track.title)) score -= 4;

  return score;
}

function buildQueueInsights(queueList, blockedTracks, focusDuration, autoDownload) {
  const totalSeconds = queueList.reduce((sum, track) => sum + parseTrackLength(track.length), 0);
  const totalMinutes = totalSeconds / 60;
  const offlineCount = queueList.filter((track) => track.offline).length;
  const blockedCount = queueList.filter((track) => track.distracting || blockedTracks.includes(track.title)).length;
  const reviewCount = queueList.filter((track) => track.focusSafe === false).length;
  const coverageGap = Math.max(0, focusDuration - Math.round(totalMinutes));
  const readiness = clamp(
    Math.round(
      100 - blockedCount * 18 - reviewCount * 8 - coverageGap * 1.4 - (autoDownload ? 0 : Math.max(6, (queueList.length - offlineCount) * 3))
    ),
    32,
    99
  );
  const issues = [];

  if (coverageGap > 0) issues.push(`durasi kurang ${coverageGap}m`);
  if (blockedCount > 0) issues.push(`${blockedCount} lagu berisiko distraksi`);
  if (queueList.length > 0 && offlineCount < Math.ceil(queueList.length * 0.6)) issues.push("cadangan offline tipis");

  return {
    totalMinutes: Math.max(0, Math.round(totalMinutes)),
    offlineCount,
    blockedCount,
    reviewCount,
    readiness,
    issues,
    note: issues.length > 0 ? `Prioritas: ${issues[0]}.` : "Queue sudah siap untuk sesi fokus berikutnya.",
  };
}

function rankPlaylistsByFit(items, { activity, selectedContext, lyricPreference, focusDuration, autoDownload, playlistTracks, blockedTracks }) {
  return items
    .map((playlist) => {
      let score = 48;
      const reasons = [];
      const blockedHitCount = (playlistTracks[playlist.id] ?? [])
        .map((songId) => songCatalog.find((song) => song.id === songId))
        .filter(Boolean)
        .filter((song) => blockedTracks.includes(song.title)).length;

      if (playlist.activity === activity) {
        score += 22;
        reasons.push(activity);
      }
      if (playlist.context === selectedContext) {
        score += 18;
        reasons.push(selectedContext);
      }
      if (playlist.lyric === lyricPreference) {
        score += 12;
        reasons.push(lyricPreference.toLowerCase());
      }
      if (Math.abs(playlist.duration - focusDuration) <= 15) {
        score += 10;
        reasons.push("durasi pas");
      }
      if (playlist.offline && autoDownload) {
        score += 8;
        reasons.push("offline ready");
      }
      if (blockedHitCount > 0) {
        score -= blockedHitCount * 12;
        reasons.push(`${blockedHitCount} blocked`);
      }

      return {
        ...playlist,
        match: clamp(score, 45, 99),
        trackCount: playlistTracks[playlist.id]?.length ?? 0,
        insight: reasons.slice(0, 2).join(" • ") || "siap untuk fokus",
      };
    })
    .sort((left, right) => right.match - left.match || left.duration - right.duration);
}

function PrototypeProvider({ children, initialScreen = DEFAULT_SCREEN }) {
  const router = useRouter();
  const pathname = usePathname();
  const [screen, setScreenState] = useState(initialScreen);
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

  const skipCurrentTrack = useCallback(() => {
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
  }, [rotateQueue, showToast]);

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
      skipCurrentTrack,
    ]
  );

  return <PrototypeContext.Provider value={value}>{children}</PrototypeContext.Provider>;
}

function usePrototype() {
  const context = useContext(PrototypeContext);
  if (!context) {
    throw new Error("usePrototype must be used inside PrototypeProvider");
  }
  return context;
}

export default function FocusTunesPrototype({ initialScreen = DEFAULT_SCREEN }) {
  return (
    <PrototypeProvider initialScreen={initialScreen}>
      <AppShell>
        <PrototypeRouter />
      </AppShell>
    </PrototypeProvider>
  );
}

function PrototypeRouter() {
  const { screen } = usePrototype();
  const screens = {
    splash: SplashScreen,
    login: LoginScreen,
    onboarding: OnboardingScreen,
    home: HomeScreen,
    music: MusicScreen,
    preset: PresetScreen,
    session: SessionScreen,
    player: PlayerScreen,
    queue: QueueScreen,
    review: ReviewScreen,
    stats: StatsScreen,
  };
  const Screen = screens[screen] ?? HomeScreen;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={screen}
        className="h-full"
        initial={{ opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -18 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        <Screen />
      </motion.div>
    </AnimatePresence>
  );
}

function AppShell({ children }) {
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
              <p className="text-sm text-slate-500">Prototype aplikasi fokus berbasis musik</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Screens</p>
            <ScreenSwitcher />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <FeaturePill icon={Sparkles} title="One-tap focus" subtitle="aktivitas + konteks" />
            <FeaturePill icon={Settings2} title="Preset setup" subtitle="queue dan filter tersimpan" />
            <FeaturePill icon={ShieldCheck} title="Distraction review" subtitle="blokir lagu pengganggu" />
            <FeaturePill icon={WifiOff} title="Offline ready" subtitle="fallback tanpa jeda" />
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Demo narrative</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Flow sekarang menutup loop utama: personalisasi, mulai fokus, kontrol musik, edit queue, review sesi,
              lalu statistik yang memberi saran preset berikutnya.
            </p>
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

function ScreenSwitcher() {
  const { screen, setScreen } = usePrototype();
  const items = Object.entries(screenLabels);

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map(([key, label]) => (
        <button
          key={key}
          onClick={() => setScreen(key)}
          className={cx(
            "rounded-2xl border px-3 py-2 text-sm font-medium transition",
            screen === key
              ? "border-[#082B5C] bg-[#082B5C] text-white shadow-lg"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function ReferenceStrip() {
  const refs = [
    { label: "Splash", image: referenceImages.splash },
    { label: "Login", image: referenceImages.login },
    { label: "Home", image: referenceImages.home },
    { label: "Logo", image: referenceImages.logo },
  ];

  return (
    <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Local references</p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {refs.map((item) => (
          <div key={item.label} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <div className="aspect-[9/16] bg-white">
              <img src={item.image} alt={`${item.label} reference`} className="h-full w-full object-cover" />
            </div>
            <div className="truncate px-2 py-1 text-center text-[10px] font-medium text-slate-500">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhoneFrame({ children }) {
  return (
    <div className="relative h-[844px] w-[390px] overflow-hidden rounded-[42px] border-[10px] border-[#0b1930] bg-white shadow-[0_30px_80px_rgba(8,43,92,0.24)]">
      <div className="pointer-events-none absolute left-1/2 top-0 z-30 h-7 w-40 -translate-x-1/2 rounded-b-[18px] bg-[#0b1930]" />
      {children}
      <PrototypeToast />
    </div>
  );
}

function PrototypeToast() {
  const { toast } = usePrototype();

  return (
    <AnimatePresence>
      {toast ? (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="pointer-events-none absolute left-4 right-4 top-16 z-40 rounded-[24px] border border-[#CFE6EC] bg-white/96 px-4 py-3 shadow-[0_14px_32px_rgba(8,43,92,0.18)] backdrop-blur"
        >
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#1C9AA0]">{toast.title}</div>
          <div className="mt-1 text-sm font-medium text-[#082B5C]">{toast.description}</div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function StatusBar({ dark = true }) {
  return (
    <div className={cx("flex items-center justify-between px-6 pt-4 text-sm font-semibold", dark ? "text-[#0a2342]" : "text-white")}>
      <span>9:41</span>
      <div className="flex items-center gap-2 text-[10px]">
        <div className="h-2 w-2 rounded-full bg-current opacity-80" />
        <div className="h-2 w-4 rounded-full border border-current opacity-70" />
        <div className="h-2 w-6 rounded-sm border border-current">
          <div className="h-full w-4 rounded-[2px] bg-current" />
        </div>
      </div>
    </div>
  );
}

function BrandMark({ small = false, light = false }) {
  const size = small ? "h-12 w-12" : "h-24 w-24";
  return (
    <div className={cx("relative shrink-0 rounded-[28px]", size, light ? "bg-white/15" : "bg-white shadow-sm")}>
      <div
        className={cx(
          "absolute left-1/2 top-1/2 h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-[22px]",
          light ? "bg-white/15" : "bg-[#EAF7F8]"
        )}
      />
      <div className={cx("absolute left-[20%] top-[18%] font-black tracking-tight text-[#082B5C]", small ? "text-lg" : "text-[2.1rem]")}>F</div>
      <div className={cx("absolute right-[18%] top-[18%] font-black tracking-tight text-[#1C9AA0]", small ? "text-lg" : "text-[2.1rem]")}>T</div>
      <div className="absolute bottom-[20%] left-1/2 flex -translate-x-1/2 items-end gap-[3px]">
        {[16, 24, 34, 24, 16].map((h, idx) => (
          <span key={idx} className={cx("rounded-full bg-[#1C9AA0]", small ? "w-[3px]" : "w-[4px]")} style={{ height: small ? h * 0.45 : h }} />
        ))}
      </div>
    </div>
  );
}

function AppPage({ children, showMiniPlayer = true }) {
  return (
    <div className="relative h-full bg-[#FAFCFE]">
      <StatusBar />
      {children}
      {showMiniPlayer ? <MiniPlayer /> : null}
      <BottomNav />
    </div>
  );
}

function TopTabs() {
  const { screen, setScreen } = usePrototype();
  const activeHome = ["home", "preset", "onboarding"].includes(screen);
  const activeSession = ["session", "player", "review"].includes(screen);

  return (
    <div className="flex items-center gap-3">
      <div className="grid min-w-0 flex-1 grid-cols-3 gap-2">
        <Pill active={activeHome} onClick={() => setScreen("home")}>
          <span>
            Quick
            <br />
            Focus
          </span>
        </Pill>
        <Pill active={screen === "music"} onClick={() => setScreen("music")}>
          Music
        </Pill>
        <Pill active={activeSession} onClick={() => setScreen("session")}>
          Session
        </Pill>
      </div>
      <Avatar />
    </div>
  );
}

function Pill({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "grid min-h-[52px] min-w-0 place-items-center rounded-full border px-2.5 py-2 text-center text-[13px] font-semibold leading-tight transition",
        active ? "border-[#082B5C] bg-[#082B5C] text-white shadow-sm" : "border-[#082B5C] bg-white text-[#082B5C]"
      )}
    >
      {children}
    </button>
  );
}

function Avatar() {
  return (
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#EAF7F8] ring-1 ring-[#CDE4EA]">
      <UserCircle2 className="h-7 w-7 text-[#082B5C]" />
    </div>
  );
}

function BottomNav() {
  const { screen, setScreen } = usePrototype();
  const items = [
    { key: "home", label: "Home", icon: House },
    { key: "music", label: "Music", icon: Music4 },
    { key: "queue", label: "Queue", icon: ListOrdered },
    { key: "stats", label: "Stats", icon: ChartNoAxesColumn },
  ];

  return (
    <div className="absolute inset-x-0 bottom-0 z-10 rounded-t-[30px] border-t border-slate-200 bg-white/[0.97] px-6 pb-7 pt-4 backdrop-blur">
      <div className="grid grid-cols-4 gap-1">
        {items.map(({ key, label, icon: Icon }) => {
          const active = screen === key || (key === "home" && screen === "preset");
          return (
            <button key={label} onClick={() => setScreen(key)} className="flex flex-col items-center gap-1 py-1">
              <Icon className={cx("h-5 w-5", active ? "text-[#082B5C]" : "text-slate-400")} />
              <span className={cx("text-[11px] font-medium", active ? "text-[#082B5C]" : "text-slate-400")}>{label}</span>
            </button>
          );
        })}
      </div>
      <div className="mx-auto mt-2 h-1 w-28 rounded-full bg-[#0b1930]" />
    </div>
  );
}

function MiniPlayer() {
  return <NowPlayingBar floating />;
}

function NowPlayingBar({ floating = false }) {
  const { setScreen, isMusicPlaying, setIsMusicPlaying, queueList } = usePrototype();
  const current = queueList[0] ?? initialQueueTracks[0];

  return (
    <div
      className={cx(
        "flex items-center gap-3 rounded-2xl bg-[#041C26] px-3 py-2.5 text-left text-white",
        floating ? "absolute bottom-[92px] left-4 right-4 z-20 shadow-2xl" : "shadow-lg"
      )}
    >
      <button onClick={() => setScreen("player")} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <div className="h-12 w-12 shrink-0 rounded-xl bg-gradient-to-br from-cyan-500/20 to-sky-300/10 ring-1 ring-white/10" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{current.title}</div>
          <div className="truncate text-[11px] uppercase tracking-[0.18em] text-emerald-400">{current.artist}</div>
        </div>
      </button>
      <div className="flex items-center gap-3">
        <Volume2 className="h-4 w-4 text-emerald-400" />
        <button
          onClick={() => setIsMusicPlaying((prev) => !prev)}
          className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white"
          aria-label={isMusicPlaying ? "Pause music" : "Play music"}
        >
          {isMusicPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function SectionTitle({ title, action, onAction }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-[13px] font-black uppercase tracking-tight text-[#111827]">{title}</h3>
      {action ? (
        <button onClick={onAction} className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          {action}
        </button>
      ) : null}
    </div>
  );
}

function FeaturePill({ icon: Icon, title, subtitle }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <Icon className="h-4 w-4 text-[#1C9AA0]" />
      <div className="mt-2 text-sm font-semibold text-[#082B5C]">{title}</div>
      <div className="text-xs text-slate-500">{subtitle}</div>
    </div>
  );
}

function PreferenceChip({ active, label, description, icon: Icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "flex items-center gap-2 rounded-2xl border px-3 py-3 text-left transition",
        active ? "border-[#082B5C] bg-[#082B5C] text-white shadow-md" : "border-slate-200 bg-white text-[#082B5C]"
      )}
    >
      {Icon ? (
        <div className={cx("grid h-8 w-8 shrink-0 place-items-center rounded-xl", active ? "bg-white/15" : "bg-[#ECF7F8]")}>
          <Icon className={cx("h-4 w-4", active ? "text-white" : "text-[#1C9AA0]")} />
        </div>
      ) : null}
      <span className="min-w-0">
        <span className="block text-sm font-bold">{label}</span>
        {description ? <span className={cx("block truncate text-xs", active ? "text-white/70" : "text-slate-500")}>{description}</span> : null}
      </span>
    </button>
  );
}

function PrimaryAction({ children, icon: Icon = ChevronRight, onClick, variant = "primary" }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left text-base font-semibold shadow-sm",
        variant === "primary"
          ? "bg-[#082B5C] text-white shadow-[0_12px_28px_rgba(8,43,92,0.24)]"
          : "border border-[#BFD1EA] bg-white text-[#082B5C]"
      )}
    >
      <span>{children}</span>
      <Icon className="h-5 w-5" />
    </button>
  );
}

function ActionCard({ icon: Icon, title, subtitle, action, onClick }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-[22px] bg-white px-4 py-4 text-left shadow-sm ring-1 ring-slate-100">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#ECF7F8] text-[#1C9AA0]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-[#082B5C]">{title}</div>
        <div className="truncate text-xs text-slate-500">{subtitle}</div>
      </div>
      {action ? <div className="rounded-full bg-[#EEF4FF] px-2.5 py-1 text-[10px] font-semibold text-[#2F6DF6]">{action}</div> : <ChevronRight className="h-4 w-4 text-slate-300" />}
    </button>
  );
}

function PlaylistCard({ playlist, selected = false, compact = false, match, insight, onClick, onUse, onQueue, onOffline }) {
  return (
    <div className={cx("rounded-[22px] bg-white p-2 shadow-sm ring-1", selected ? "ring-[#1C9AA0]" : "ring-slate-100")}>
      <button onClick={onClick} className="w-full text-left">
        <div className={cx("relative overflow-hidden rounded-[16px] bg-gradient-to-br", playlist.accent, compact ? "h-20" : "h-28")}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(8,43,92,0.15),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(28,154,160,0.18),transparent_35%)]" />
          <Music4 className="absolute bottom-3 left-3 h-5 w-5 text-[#082B5C]" />
          {typeof match === "number" ? (
            <div className="absolute left-3 top-3 rounded-full bg-[#082B5C]/85 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">
              {match}% fit
            </div>
          ) : null}
          {playlist.offline ? (
            <div className="absolute right-3 top-3 rounded-full bg-white/80 px-2 py-1 text-[10px] font-bold text-[#082B5C]">OFF</div>
          ) : null}
        </div>
        <div className="px-1 pb-1 pt-2">
          <div className="truncate text-sm font-bold text-[#082B5C]">{playlist.title}</div>
          <div className="truncate text-xs text-slate-500">{playlist.subtitle}</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {playlist.tags.slice(0, compact ? 2 : 3).map((tag) => (
              <span key={tag} className="rounded-full bg-[#F1F7FA] px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                {tag}
              </span>
            ))}
          </div>
          {insight ? <div className="mt-2 text-[11px] font-medium text-slate-500">{insight}</div> : null}
        </div>
      </button>
      {!compact ? (
        <div className="mt-2 grid grid-cols-3 gap-2">
          <button onClick={onUse} className="rounded-xl bg-[#082B5C] px-2 py-2 text-[11px] font-semibold text-white">
            Pakai
          </button>
          <button onClick={onQueue} className="rounded-xl bg-[#ECF7F8] px-2 py-2 text-[11px] font-semibold text-[#1C9AA0]">
            Queue
          </button>
          <button onClick={onOffline} className="rounded-xl bg-[#EEF4FF] px-2 py-2 text-[11px] font-semibold text-[#2F6DF6]">
            Offline
          </button>
        </div>
      ) : null}
    </div>
  );
}

function StatBlock({ label, value, icon: Icon }) {
  return (
    <div className="rounded-[22px] bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center justify-between gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#ECF7F8] text-[#1C9AA0]">
          <Icon className="h-5 w-5" />
        </div>
        <ChevronRight className="h-4 w-4 text-slate-300" />
      </div>
      <div className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-black text-[#082B5C]">{value}</div>
    </div>
  );
}

function QueueTrackRow({ track, index, onUp, onDown, onRemove, onBlock }) {
  return (
    <div className="rounded-[22px] bg-white p-3 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-sm font-bold text-slate-500">{index + 1}</div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-[#082B5C]">{track.title}</div>
          <div className="truncate text-xs text-slate-400">
            {track.artist} - {track.length} {track.offline ? "- offline" : ""}
          </div>
        </div>
        {track.distracting ? <Ban className="h-4 w-4 text-rose-500" /> : null}
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        <IconButton label="Up" icon={ArrowUp} onClick={onUp} />
        <IconButton label="Down" icon={ArrowDown} onClick={onDown} />
        <IconButton label="Block" icon={Ban} onClick={onBlock} />
        <IconButton label="Remove" icon={Trash2} onClick={onRemove} />
      </div>
    </div>
  );
}

function IconButton({ label, icon: Icon, onClick }) {
  return (
    <button onClick={onClick} className="grid h-9 place-items-center rounded-xl bg-[#F7FAFC] text-slate-500 ring-1 ring-slate-100" aria-label={label}>
      <Icon className="h-4 w-4" />
    </button>
  );
}

function SplashScreen() {
  const { setScreen } = usePrototype();
  return (
    <div className="relative h-full overflow-hidden bg-[linear-gradient(180deg,#99ECF5_0%,#F7FCFE_22%,#FFFFFF_100%)]">
      <StatusBar />
      <div className="absolute left-5 top-16 h-16 w-24 rounded-full bg-white/80 blur-sm" />
      <div className="absolute right-6 top-28 h-10 w-20 rounded-full bg-sky-50" />
      <div className="absolute left-10 top-1/3 h-8 w-16 rounded-full bg-sky-50/80" />
      <div className="relative z-10 flex h-full flex-col items-center px-8 pb-10 pt-16">
        <BrandMark />
        <div className="mt-4 text-center">
          <div className="text-[3rem] font-black leading-none tracking-tight text-[#082B5C]">
            Focus<span className="text-[#1C9AA0]">Tunes</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-[#0d5970]">Focus Flow Finish</p>
        </div>

        <div className="relative mt-auto flex w-full justify-center">
          <div className="absolute bottom-0 h-44 w-[110%] rounded-t-[50%] bg-[#BEE6EC]" />
          <div className="absolute bottom-10 left-0 h-36 w-20 rounded-t-full bg-[#5BAFB7] opacity-40" />
          <div className="absolute bottom-4 right-4 h-24 w-16 rounded-full bg-[#0A4A6B] opacity-20" />
          <div className="relative z-10 flex w-full items-end justify-center gap-4">
            <div className="mb-6 h-52 w-40 rounded-b-[28px] rounded-t-[80px] bg-[#1C9AA0] p-2 shadow-lg">
              <div className="flex h-full items-end justify-center rounded-[24px] bg-[#264155]">
                <div className="mb-2 h-10 w-16 rounded-t-full bg-white/90" />
              </div>
            </div>
            <div className="mb-1 h-44 w-28 rotate-6 rounded-[28px] bg-[#26384A]" />
          </div>
        </div>

        <button
          onClick={() => setScreen("login")}
          className="mt-8 w-full rounded-2xl bg-[#082B5C] px-5 py-4 text-base font-semibold text-white shadow-[0_12px_30px_rgba(8,43,92,0.28)]"
        >
          Mulai
        </button>
      </div>
    </div>
  );
}

function LoginScreen() {
  const { setScreen } = usePrototype();
  return (
    <div className="h-full overflow-hidden bg-[linear-gradient(180deg,#99ECF5_0%,#F7FCFE_18%,#FFFFFF_32%)] text-[#082B5C]">
      <StatusBar />
      <div className="h-full overflow-y-auto px-6 pb-10 pt-8">
        <div className="flex flex-col items-center">
          <BrandMark />
          <div className="mt-3 text-center">
            <div className="text-4xl font-black tracking-tight text-[#082B5C]">
              Focus<span className="text-[#1C9AA0]">Tunes</span>
            </div>
            <div className="mt-1 text-xs font-semibold text-slate-500">Focus Flow Finish</div>
          </div>
        </div>

        <div className="mt-10">
          <h1 className="text-[2.1rem] font-black leading-tight tracking-tight text-[#082B5C]">Masuk ke akun Anda</h1>
          <p className="mt-2 text-center text-slate-500">Masuk untuk menyimpan preset fokus dan riwayat sesi.</p>
        </div>

        <div className="mt-8 space-y-4">
          <Field label="Email" value="user@gmail.com" />
          <Field label="Password" value="******" secure />
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <label className="flex items-center gap-2">
            <span className="grid h-4 w-4 place-items-center rounded-[4px] border border-[#1C9AA0] bg-[#ECF7F8]">
              <Check className="h-3 w-3 text-[#1C9AA0]" />
            </span>
            Remember me
          </label>
          <button className="font-medium text-[#4B76F1]">Forgot password?</button>
        </div>

        <button
          onClick={() => setScreen("onboarding")}
          className="mt-6 w-full rounded-2xl border border-[#265CF2] bg-[#082B5C] px-5 py-4 text-lg font-semibold text-white shadow-[0_12px_28px_rgba(8,43,92,0.24)]"
        >
          Masuk
        </button>

        <div className="mt-6 flex items-center gap-4 text-slate-400">
          <div className="h-px flex-1 bg-slate-200" />
          <span>Atau</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <button className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white px-5 py-4 text-lg font-semibold text-slate-700">
          <div className="grid h-6 w-6 place-items-center rounded-full bg-slate-50 text-sm">G</div>
          Lanjutkan dengan Google
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, secure = false }) {
  return (
    <div>
      <label className="mb-2 block text-sm text-slate-500">{label}</label>
      <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <span className="flex-1 text-lg text-slate-800">{value}</span>
        {secure ? <span className="text-slate-300">o</span> : null}
      </div>
    </div>
  );
}

function OnboardingScreen() {
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
            <div className="text-2xl font-black tracking-tight text-[#082B5C]">Personalisasi</div>
            <div className="text-sm text-slate-500">Atur baseline agar rekomendasi fokus lebih relevan.</div>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <div>
            <SectionTitle title="Aktivitas utama" />
            <div className="mt-3 grid grid-cols-2 gap-3">
              {Object.values(focusActivities).map((item) => (
                <PreferenceChip
                  key={item.label}
                  active={selectedActivities.includes(item.label)}
                  label={item.label}
                  description={`${item.session} menit`}
                  icon={Sparkles}
                  onClick={() => toggleActivity(item.label)}
                />
              ))}
            </div>
          </div>

          <div>
            <SectionTitle title="Kondisi paling sering" />
            <div className="mt-3 grid grid-cols-2 gap-3">
              {contextOptions.map((item) => (
                <PreferenceChip
                  key={item.id}
                  active={selectedContext === item.id}
                  label={item.label}
                  description={item.description}
                  icon={item.icon}
                  onClick={() => setSelectedContext(item.id)}
                />
              ))}
            </div>
          </div>

          <div>
            <SectionTitle title="Preferensi lirik" />
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
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle title="Durasi fokus default" />
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
                  {item}m
                </button>
              ))}
            </div>
          </div>

          <ActionCard
            icon={Download}
            title="Auto-download playlist fokus"
            subtitle={autoDownload ? "Aktif saat perangkat terhubung Wi-Fi" : "Nonaktif untuk sementara"}
            action={autoDownload ? "Aktif" : "Off"}
            onClick={() => setAutoDownload((prev) => !prev)}
          />

          <PrimaryAction onClick={() => savePreset("home")}>Simpan dan lanjut</PrimaryAction>
        </div>
      </div>
    </div>
  );
}

function HomeScreen() {
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

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/10 px-2 py-3 ring-1 ring-white/10">
      <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-100">{label}</div>
      <div className="mt-1 truncate text-sm font-bold text-white">{value}</div>
    </div>
  );
}

function PresetScreen() {
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

function MusicScreen() {
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

function PlayerScreen() {
  const {
    setScreen,
    isMusicPlaying,
    setIsMusicPlaying,
    queueList,
    selectedPlaylist,
    currentTrack,
    sessionProgress,
    sessionState,
    rotateQueue,
    skipCurrentTrack,
  } = usePrototype();
  const current = currentTrack ?? queueList[0] ?? initialQueueTracks[0];
  const trackProgress = clamp(sessionState.hasStarted ? sessionProgress : 0.42, 0.05, 0.97);
  const trackLengthSeconds = parseTrackLength(current.length);
  const elapsedTrackSeconds = Math.round(trackLengthSeconds * trackProgress);
  const remainingTrackSeconds = Math.max(0, trackLengthSeconds - elapsedTrackSeconds);
  const lyricHeadline = current.focusSafe === false ? "Energi sedang tinggi" : "Focus-safe track";
  const lyricBody = current.focusSafe === false ? "Cocok untuk break singkat atau sesi ride." : "Aman untuk writing, study, dan coding mode.";

  return (
    <div className="h-full overflow-hidden bg-[#19191D] text-white">
      <StatusBar dark={false} />
      <div className="h-full overflow-y-auto px-5 pb-10 pt-7">
        <div className="text-sm font-medium text-white/45">Track View</div>

        <div className="mt-3 rounded-[28px] bg-[linear-gradient(180deg,#A51F18_0%,#5B0907_52%,#1A1111_100%)] px-4 pb-5 pt-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <button onClick={() => setScreen("session")} className="grid h-9 w-9 place-items-center rounded-full text-white/90">
              <ChevronDown className="h-5 w-5" />
            </button>
            <div className="truncate text-sm font-bold">{selectedPlaylist.title}</div>
            <button className="grid h-9 w-9 place-items-center rounded-full text-white/90">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>

          <div className="mx-auto mt-12 grid aspect-square w-[86%] place-items-center bg-[#C63B2E] shadow-[0_26px_60px_rgba(0,0,0,0.28)]">
            <div className="text-center">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-yellow-200">FocusTunes</div>
              <div className="mt-2 text-[7rem] font-black leading-none text-yellow-100">1</div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-yellow-100/80">Deep Flow</div>
            </div>
          </div>

          <div className="mt-10 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="truncate text-lg font-black">{current.title}</div>
              <div className="mt-1 truncate text-sm text-white/55">{current.artist}</div>
            </div>
            <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white/80">
              <Heart className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/30">
              <div className="h-full rounded-full bg-white" style={{ width: `${trackProgress * 100}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-white/55">
              <span>{formatClock(elapsedTrackSeconds)}</span>
              <span>-{formatClock(remainingTrackSeconds)}</span>
            </div>
          </div>

          <div className="mt-7 flex items-center justify-between">
            <button className="text-white/75">
              <Shuffle className="h-5 w-5" />
            </button>
            <button onClick={() => rotateQueue("previous")} className="text-white">
              <SkipBack className="h-7 w-7" />
            </button>
            <button
              onClick={() => setIsMusicPlaying((prev) => !prev)}
              className="grid h-16 w-16 place-items-center rounded-full bg-white text-[#4E0A08] shadow-xl"
            >
              {isMusicPlaying ? <Pause className="h-7 w-7" /> : <Play className="ml-1 h-7 w-7" />}
            </button>
            <button onClick={skipCurrentTrack} className="text-white">
              <SkipForward className="h-7 w-7" />
            </button>
            <button className="text-emerald-400">
              <Repeat2 className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-7 flex items-center justify-between text-white/70">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-400">
              <Volume2 className="h-4 w-4" /> BEATSPILL+
            </div>
            <div className="flex items-center gap-5">
              <Share2 className="h-5 w-5" />
              <button onClick={() => setScreen("queue")}>
                <ListOrdered className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[24px] bg-[#E46F24] p-4 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div className="text-base font-black">Lyrics</div>
            <button className="rounded-full bg-black/25 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em]">More</button>
          </div>
          <div className="mt-5 space-y-3 text-xl font-black leading-7 text-white/90">
            <p>{lyricHeadline}</p>
            <p className="text-white/55">{current.lyric ? `Lirik: ${current.lyric}` : "No vocal lyrics detected"}</p>
            <p className="text-white/55">{lyricBody}</p>
          </div>
        </div>

        <div className="mt-5 rounded-[24px] bg-white/[0.08] p-4 ring-1 ring-white/10">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-black">Queue</div>
              <div className="text-xs text-white/45">Up next in focus mode</div>
            </div>
            <button onClick={() => setScreen("queue")} className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-400">
              Open
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {queueList.slice(0, 5).map((track, idx) => (
              <div key={track.id} className="flex items-center gap-3 rounded-2xl bg-white/[0.06] px-3 py-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-sm font-bold text-white/60">{idx + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-white">{track.title}</div>
                  <div className="truncate text-xs text-white/45">{track.artist}</div>
                </div>
                <div className="text-xs text-white/45">{track.length}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SessionScreen() {
  const {
    activity,
    selectedPlaylist,
    focusDuration,
    selectedContext,
    filters,
    setFilters,
    setScreen,
    isSessionPaused,
    queueList,
    queueInsights,
    sessionState,
    sessionProgress,
    sessionSummaryData,
    startSession,
    toggleSessionPause,
    finishSession,
  } = usePrototype();
  const hasStarted = sessionState.hasStarted;
  const progress = hasStarted ? sessionProgress : queueInsights.readiness / 100;
  const ring = useMemo(
    () => ({
      background: `conic-gradient(${isSessionPaused ? "#94A3B8" : brand.teal} ${progress * 360}deg, rgba(8,43,92,0.10) 0deg)`,
    }),
    [progress, isSessionPaused]
  );

  const toggles = [
    { key: "playlist", label: "Preset queue", icon: Music4, note: selectedPlaylist.title },
    { key: "lyrics", label: "Filter lirik", icon: Filter, note: selectedPlaylist.lyric },
    { key: "noise", label: "Noise cancellation", icon: Headphones, note: `aktif untuk konteks ${selectedContext}` },
    { key: "offline", label: "Offline fallback", icon: WifiOff, note: selectedPlaylist.offline ? "playlist aman offline" : "butuh download" },
  ];
  const sessionLabel = !hasStarted ? "Session ready" : isSessionPaused ? "Session paused" : "Session active";
  const sessionCopy = !hasStarted
    ? "Preset, queue, dan filter sudah siap. Mulai sesi untuk menyalakan countdown fokus."
    : isSessionPaused
      ? "Timer berhenti sementara. Queue dan filter tetap tersimpan."
      : `${selectedPlaylist.title} berjalan untuk konteks ${selectedContext}.`;

  return (
    <AppPage showMiniPlayer={false}>
      <div className="h-full overflow-y-auto px-5 pb-[180px] pt-3">
        <TopTabs />

        <div className="mt-5 rounded-[30px] border border-cyan-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{sessionLabel}</div>
              <div className="mt-2 text-2xl font-black tracking-tight text-[#082B5C]">{activity} Mode</div>
              <p className="mt-2 text-sm leading-6 text-slate-500">{sessionCopy}</p>
            </div>
            <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full" style={ring}>
              <div className="grid h-20 w-20 place-items-center rounded-full bg-white shadow-inner">
                <div className="text-center">
                  <div className="text-xl font-black tracking-tight text-[#082B5C]">
                    {!hasStarted ? `${queueInsights.readiness}%` : isSessionPaused ? "Pause" : sessionSummaryData.remainingLabel}
                  </div>
                  <div className="text-[10px] text-slate-500">{hasStarted ? `${focusDuration}:00` : "queue ready"}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <SessionStat label={hasStarted ? "Sisa" : "Queue"} value={hasStarted ? `${queueList.length} lagu` : `${queueInsights.totalMinutes}m`} />
            <SessionStat label={hasStarted ? "Skip" : "Health"} value={hasStarted ? `${sessionState.skipCount}` : `${queueInsights.readiness}%`} />
            <SessionStat label="Setup" value={`${sessionState.setupSeconds} detik`} />
          </div>
        </div>

        <div className="mt-5">
          <SectionTitle title="Now Playing" action={hasStarted ? "Tap to view" : "Preview"} />
          <div className="mt-3">
            <NowPlayingBar />
          </div>
        </div>

        <div className="mt-6">
          <SectionTitle title="Focus Setup" action="Saved" />
          <div className="mt-3 grid grid-cols-2 gap-3">
            {toggles.map(({ key, label, note, icon: Icon }) => (
              <ToggleCard
                key={key}
                icon={Icon}
                title={label}
                note={note}
                enabled={filters[key]}
                onClick={() => setFilters((prev) => ({ ...prev, [key]: !prev[key] }))}
              />
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-[26px] bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#ECF7F8] text-[#1C9AA0]">
              <ListOrdered className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[#082B5C]">Queue aman untuk fokus</div>
              <div className="mt-1 text-xs leading-5 text-slate-500">{queueInsights.note}</div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {queueList.slice(0, 3).map((track, idx) => (
              <QueuePreviewRow key={track.id} index={idx + 1} title={track.title} length={track.length} />
            ))}
          </div>
          <button
            onClick={() => setScreen("queue")}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#BFD1EA] bg-white px-4 py-3 text-sm font-semibold text-[#082B5C]"
          >
            Lihat Queue <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="absolute bottom-[106px] left-5 right-5 z-20 flex gap-3">
        <button
          onClick={() => (hasStarted ? toggleSessionPause() : startSession())}
          className="flex-1 rounded-2xl bg-[#2F6DF6] px-4 py-4 text-sm font-semibold text-white shadow-lg"
        >
          {!hasStarted ? "Mulai Session" : isSessionPaused ? "Resume Session" : "Pause Session"}
        </button>
        <button
          onClick={() => (hasStarted ? finishSession() : setScreen("preset"))}
          className="rounded-2xl border border-[#BFD1EA] bg-white px-6 py-4 text-sm font-semibold text-[#082B5C]"
        >
          {hasStarted ? "Selesai" : "Edit Preset"}
        </button>
      </div>
    </AppPage>
  );
}

function ToggleCard({ icon: Icon, title, note, enabled, onClick }) {
  return (
    <button onClick={onClick} className="flex min-w-0 items-center gap-3 rounded-[22px] bg-white px-3 py-3 text-left shadow-sm ring-1 ring-slate-100">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#ECF7F8] text-[#1C9AA0]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-bold text-[#082B5C]">{title}</div>
        <div className="truncate text-[11px] text-slate-400">{note}</div>
      </div>
      <div className={cx("h-2.5 w-2.5 shrink-0 rounded-full", enabled ? "bg-[#2F6DF6]" : "bg-slate-300")} />
    </button>
  );
}

function SessionStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#F7FAFC] px-2 py-3 ring-1 ring-slate-100">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className="mt-1 truncate text-sm font-black text-[#082B5C]">{value}</div>
    </div>
  );
}

function QueuePreviewRow({ index, title, length }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5">
      <div className="grid h-8 w-8 place-items-center rounded-xl bg-white text-xs font-bold text-slate-500">{index}</div>
      <div className="min-w-0 flex-1 truncate text-sm font-semibold text-[#082B5C]">{title}</div>
      <div className="text-xs font-medium text-slate-400">{length}</div>
    </div>
  );
}

function QueueScreen() {
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

function ReviewScreen() {
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

function StatsScreen() {
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
