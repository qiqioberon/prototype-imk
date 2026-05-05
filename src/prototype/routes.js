export const DEFAULT_SCREEN = "splash";

export const screenLabels = {
  splash: "Splash",
  login: "Login",
  onboarding: "Onboarding",
  home: "Home",
  music: "Music",
  preset: "Preset",
  session: "Session",
  player: "Player",
  queue: "Queue",
  review: "Review",
  stats: "Stats",
};

export const screenOrder = Object.keys(screenLabels);

export const screenPaths = {
  splash: "/splash",
  login: "/login",
  onboarding: "/onboarding",
  home: "/home",
  music: "/music",
  preset: "/preset",
  session: "/session",
  player: "/player",
  queue: "/queue",
  review: "/review",
  stats: "/stats",
};

export function isValidScreen(screen) {
  return Object.prototype.hasOwnProperty.call(screenLabels, screen);
}

export function getScreenPath(screen) {
  return screenPaths[screen] ?? screenPaths[DEFAULT_SCREEN];
}

export function getScreenFromSegments(segments = []) {
  if (!segments || segments.length === 0) {
    return DEFAULT_SCREEN;
  }

  if (segments.length !== 1) {
    return null;
  }

  const [screen] = segments;
  return isValidScreen(screen) ? screen : null;
}

export function getScreenFromPathname(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  return getScreenFromSegments(segments);
}
