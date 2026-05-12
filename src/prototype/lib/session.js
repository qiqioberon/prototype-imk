import { initialQueueTracks, sessionSummary, songCatalog } from "../data.js";
import { clamp, parseTrackLength } from "./format.js";

export const initialFilters = {
  playlist: true,
  lyrics: true,
  noise: true,
  offline: true,
};
export const initialActivityMinutes = {
  Coding: 684,
  Writing: 432,
  Study: 336,
  Ride: 144,
};
export const initialFocusStats = {
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

export function createSessionState(durationMinutes, overrides = {}) {
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

export function normalizeFocusStats(stats = {}) {
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

export function normalizeSessionState(rawState, durationMinutes) {
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

export function scoreTrackForFocus(track, blockedTracks) {
  let score = 0;

  if (track.offline) score += 2;
  if (track.focusSafe !== false && !track.distracting) score += 2;
  if (track.lyric === "EN") score -= 1;
  if (track.distracting || blockedTracks.includes(track.title)) score -= 4;

  return score;
}

export function buildQueueInsights(queueList, blockedTracks, focusDuration, autoDownload) {
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

  if (coverageGap > 0) issues.push({ key: "coverageGap", params: { minutes: coverageGap } });
  if (blockedCount > 0) issues.push({ key: "blocked", params: { count: blockedCount } });
  if (queueList.length > 0 && offlineCount < Math.ceil(queueList.length * 0.6)) issues.push({ key: "offlineThin", params: {} });

  return {
    totalMinutes: Math.max(0, Math.round(totalMinutes)),
    offlineCount,
    blockedCount,
    reviewCount,
    readiness,
    issues,
  };
}

export function rankPlaylistsByFit(items, { activity, selectedContext, lyricPreference, focusDuration, autoDownload, playlistTracks, blockedTracks }) {
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
        reasons.push({ key: "activity", params: { activity } });
      }
      if (playlist.context === selectedContext) {
        score += 18;
        reasons.push({ key: "context", params: { context: selectedContext } });
      }
      if (playlist.lyric === lyricPreference) {
        score += 12;
        reasons.push({ key: "lyric", params: { lyric: lyricPreference } });
      }
      if (Math.abs(playlist.duration - focusDuration) <= 15) {
        score += 10;
        reasons.push({ key: "duration", params: {} });
      }
      if (playlist.offline && autoDownload) {
        score += 8;
        reasons.push({ key: "offline", params: {} });
      }
      if (blockedHitCount > 0) {
        score -= blockedHitCount * 12;
        reasons.push({ key: "blocked", params: { count: blockedHitCount } });
      }

      return {
        ...playlist,
        match: clamp(score, 45, 99),
        trackCount: playlistTracks[playlist.id]?.length ?? 0,
        reasonKeys: reasons.slice(0, 2),
      };
    })
    .sort((left, right) => right.match - left.match || left.duration - right.duration);
}
