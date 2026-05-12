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
import { DEFAULT_LOCALE, getDictionary, supportedLocales, translate } from "../i18n/dictionaries.js";
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
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE);
  const [showTimerInPlayer, setShowTimerInPlayer] = useState(true);
  const [showSmartQueueDetails, setShowSmartQueueDetails] = useState(true);
  const [showBlockedReasons, setShowBlockedReasons] = useState(true);
  const [toast, setToast] = useState(null);

  const dictionary = useMemo(() => getDictionary(locale), [locale]);
  const t = useCallback((key, params) => translate(locale, key, params), [locale]);

  const setScreen = useCallback(
    (nextScreen) => {
      if (!isValidScreen(nextScreen)) return;

      setScreenState(nextScreen);
      router.push(getScreenPath(nextScreen));
    },
    [router]
  );

  const showToast = useCallback((title, description, params = {}) => {
    setToast({
      id: Date.now(),
      title,
      description,
      params,
    });
  }, []);

  const setLocale = useCallback(
    (nextLocale) => {
      if (!supportedLocales.includes(nextLocale)) return;
      setLocaleState(nextLocale);
      showToast("languageChangedTitle", "languageChangedDescription", {
        language: translate(nextLocale, nextLocale === "id" ? "profile.id" : "profile.en"),
      });
    },
    [showToast]
  );

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
    if (typeof document === "undefined") return;
    document.documentElement.lang = dictionary.meta.htmlLang;
    document.title = dictionary.meta.title;
  }, [dictionary]);

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

      if (supportedLocales.includes(parsed.locale)) setLocaleState(parsed.locale);
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
      if (typeof parsed.showTimerInPlayer === "boolean") setShowTimerInPlayer(parsed.showTimerInPlayer);
      if (typeof parsed.showSmartQueueDetails === "boolean") setShowSmartQueueDetails(parsed.showSmartQueueDetails);
      if (typeof parsed.showBlockedReasons === "boolean") setShowBlockedReasons(parsed.showBlockedReasons);
    } catch (error) {
      console.error("Failed to restore FocusTunes prototype state", error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const payload = {
      locale,
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
      showTimerInPlayer,
      showSmartQueueDetails,
      showBlockedReasons,
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
    locale,
    showTimerInPlayer,
    showSmartQueueDetails,
    showBlockedReasons,
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

  const selectedPlaylistRaw = useMemo(
    () => playlists.find((item) => item.id === selectedPlaylistId) ?? playlists[0],
    [selectedPlaylistId]
  );

  const selectedPlaylistDetailRaw = useMemo(
    () => playlists.find((item) => item.id === selectedPlaylistDetailId) ?? selectedPlaylistRaw,
    [selectedPlaylistDetailId, selectedPlaylistRaw]
  );

  const selectedSongRaw = useMemo(
    () => songCatalog.find((item) => item.id === selectedSongId) ?? songCatalog[0],
    [selectedSongId]
  );

  const getActivityInfo = useCallback(
    (activityId) => ({
      ...focusActivities[activityId],
      ...(dictionary.activities[activityId] ?? {}),
      id: activityId,
    }),
    [dictionary]
  );

  const getContextInfo = useCallback(
    (contextId) => {
      const base = contextOptions.find((item) => item.id === contextId) ?? { id: contextId };
      return {
        ...base,
        ...(dictionary.contexts[contextId] ?? {}),
      };
    },
    [dictionary]
  );

  const getLyricLabel = useCallback((value) => dictionary.lyrics[value] ?? value, [dictionary]);

  const getPlaylistInfo = useCallback(
    (playlistOrId) => {
      const base =
        typeof playlistOrId === "string"
          ? playlists.find((item) => item.id === playlistOrId)
          : playlistOrId;
      if (!base) return null;
      const localized = dictionary.playlists[base.id] ?? {};
      return {
        ...base,
        ...localized,
        lyricLabel: getLyricLabel(base.lyric),
      };
    },
    [dictionary, getLyricLabel]
  );

  const getSongInfo = useCallback(
    (songOrId) => {
      const base =
        typeof songOrId === "string"
          ? songCatalog.find((item) => item.id === songOrId)
          : songOrId;
      if (!base) return null;
      return {
        ...base,
        ...(dictionary.songs[base.id] ?? {}),
      };
    },
    [dictionary]
  );

  const getTrackFocusReason = useCallback(
    (track) => {
      if (!track) return "";
      if (blockedTracks.includes(track.title)) return t("queueReasons.blocked");
      if (track.distracting) return t("queueReasons.distracting");
      if (track.focusSafe === false) return t("queueReasons.focusUnsafe");
      if (track.lyric === "EN") return t("queueReasons.vocal");
      if (!track.offline) return t("queueReasons.offline");
      return t("queueReasons.safe");
    },
    [blockedTracks, t]
  );

  const selectedPlaylist = useMemo(
    () => getPlaylistInfo(selectedPlaylistRaw) ?? selectedPlaylistRaw,
    [getPlaylistInfo, selectedPlaylistRaw]
  );

  const selectedPlaylistDetail = useMemo(
    () => getPlaylistInfo(selectedPlaylistDetailRaw) ?? selectedPlaylist,
    [getPlaylistInfo, selectedPlaylistDetailRaw, selectedPlaylist]
  );

  const selectedSong = useMemo(
    () => getSongInfo(selectedSongRaw) ?? selectedSongRaw,
    [getSongInfo, selectedSongRaw]
  );

  const currentTrack = useMemo(() => queueList[0] ?? initialQueueTracks[0], [queueList]);
  const isCurrentTrackLiked = useMemo(() => likedTracks.includes(getTrackPreferenceKey(currentTrack)), [likedTracks, currentTrack]);

  const queueInsightsRaw = useMemo(
    () => buildQueueInsights(queueList, blockedTracks, focusDuration, autoDownload),
    [queueList, blockedTracks, focusDuration, autoDownload]
  );

  const queueInsights = useMemo(() => {
    const issues = queueInsightsRaw.issues.map((issue) => t(`queueIssues.${issue.key}`, issue.params));
    return {
      ...queueInsightsRaw,
      issues,
      note: issues.length > 0 ? t("queueIssues.priority", { issue: issues[0] }) : t("queueIssues.ready"),
    };
  }, [queueInsightsRaw, t]);

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
      }).map((playlist) => {
        const localized = getPlaylistInfo(playlist) ?? playlist;
        const insight =
          playlist.reasonKeys
            ?.map((reason) =>
              t(`playlistReasons.${reason.key}`, {
                ...reason.params,
                activity: getActivityInfo(reason.params.activity)?.label ?? reason.params.activity,
                context: getContextInfo(reason.params.context)?.label ?? reason.params.context,
                lyric: getLyricLabel(reason.params.lyric),
              })
            )
            .join(" - ") || t("playlistReasons.ready");
        return { ...localized, match: playlist.match, trackCount: playlist.trackCount, reasonKeys: playlist.reasonKeys, insight };
      }),
    [
      activity,
      selectedContext,
      lyricPreference,
      focusDuration,
      autoDownload,
      playlistTracks,
      blockedTracks,
      getPlaylistInfo,
      getActivityInfo,
      getContextInfo,
      getLyricLabel,
      t,
    ]
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
        showToast("sessionNotStartedTitle", "sessionNotStartedDescription");
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
      showToast(reason === "timer" ? "sessionAutoFinishedTitle" : "sessionSavedTitle", "sessionSavedDescription", {
        duration: t("common.minutesLong", { value: nextSummary.durationMinutes }),
      });
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
      t,
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
        showToast("emptyQueueTitle", "emptyQueueDescription");
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
      showToast("sessionStartedTitle", "sessionStartedDescription", {
        activity: getActivityInfo(nextActivity)?.label ?? nextActivity,
        duration: nextDuration,
      });
    },
    [queueList.length, showToast, setScreen, activity, focusDuration, selectedActivities.length, autoDownload, filters.lyrics, getActivityInfo]
  );

  const toggleSessionPause = useCallback(() => {
    if (!sessionState.hasStarted) {
      startSession();
      return;
    }

    setIsSessionPaused((previous) => {
      const next = !previous;
      showToast(next ? "sessionPausedTitle" : "sessionResumedTitle", next ? "sessionPausedDescription" : "sessionResumedDescription");
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
      showToast("presetSavedTitle", "presetSavedDescription", { title: selectedPlaylist.title });
      if (nextScreen) setScreen(nextScreen);
    },
    [selectedPlaylist.title, setScreen, showToast]
  );

  const smartQueue = useCallback(() => {
    let fixSummary = { moved: 0, blocked: 0, readiness: queueInsights.readiness };
    setQueueList((previous) => {
      const seen = new Set();
      const deduplicated = previous.filter((track) => {
        const key = track.songId ?? `${track.title}-${track.artist}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const nextQueue = deduplicated
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

      fixSummary = {
        moved: nextQueue.filter((track, index) => track.id !== previous[index]?.id).length,
        blocked: nextQueue.filter((track) => track.distracting || blockedTracks.includes(track.title)).length,
        readiness: buildQueueInsights(nextQueue, blockedTracks, focusDuration, autoDownload).readiness,
      };

      return nextQueue;
    });
    showToast("queueFixedTitle", showSmartQueueDetails ? "queueFixedDetailed" : "queueFixedDescription", fixSummary);
  }, [blockedTracks, showToast, queueInsights.readiness, focusDuration, autoDownload, showSmartQueueDetails]);

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
        isSaved ? "favoriteAddedTitle" : "favoriteRemovedTitle",
        isSaved ? "favoriteAddedDescription" : "favoriteRemovedDescription",
        { title: track.title }
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
      nextIsEnabled ? "shuffleEnabledTitle" : "shuffleDisabledTitle",
      nextIsEnabled ? "shuffleEnabledDescription" : "shuffleDisabledDescription"
    );
  }, [showToast]);

  const cycleRepeatMode = useCallback(() => {
    let nextMode = "all";

    setRepeatMode((previous) => {
      nextMode = previous === "off" ? "all" : previous === "all" ? "one" : "off";
      return nextMode;
    });

    const modeMessages = {
      off: ["repeatOffTitle", "repeatOffDescription"],
      all: ["repeatAllTitle", "repeatAllDescription"],
      one: ["repeatOneTitle", "repeatOneDescription"],
    };
    const [title, description] = modeMessages[nextMode];

    showToast(title, description);
  }, [showToast]);

  const shareCurrentTrack = useCallback(
    async (track = currentTrack) => {
      if (!track) return;

      const shareSummary = t("toasts.shareSummary", { title: track.title, artist: track.artist });

      try {
        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(shareSummary);
          showToast("shareReadyTitle", "shareCopiedDescription");
          return;
        }
      } catch (error) {
        console.error("Failed to copy track summary", error);
      }

      showToast("shareReadyTitle", "shareFallbackDescription", { summary: shareSummary });
    },
    [currentTrack, showToast, t]
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
      showToast("repeatOneSkipTitle", "repeatOneSkipDescription");
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
    showToast("trackSkippedTitle", "trackSkippedDescription");
  }, [repeatMode, rotateQueue, showToast]);

  const value = useMemo(
    () => ({
      screen,
      setScreen,
      locale,
      setLocale,
      t,
      dictionary,
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
      showTimerInPlayer,
      setShowTimerInPlayer,
      showSmartQueueDetails,
      setShowSmartQueueDetails,
      showBlockedReasons,
      setShowBlockedReasons,
      getActivityInfo,
      getContextInfo,
      getLyricLabel,
      getPlaylistInfo,
      getSongInfo,
      getTrackFocusReason,
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
      locale,
      setLocale,
      t,
      dictionary,
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
      showTimerInPlayer,
      showSmartQueueDetails,
      showBlockedReasons,
      getActivityInfo,
      getContextInfo,
      getLyricLabel,
      getPlaylistInfo,
      getSongInfo,
      getTrackFocusReason,
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
