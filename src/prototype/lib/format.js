export function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function parseTrackLength(length = "0:00") {
  const [minutes = "0", seconds = "0"] = String(length).split(":");
  return Number(minutes) * 60 + Number(seconds);
}

export function formatClock(totalSeconds) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatDurationLabel(totalMinutes) {
  return `${Math.max(1, Math.round(totalMinutes))} menit`;
}
