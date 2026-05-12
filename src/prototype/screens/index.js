import { SplashScreen } from "./SplashScreen.jsx";
import { LoginScreen } from "./LoginScreen.jsx";
import { OnboardingScreen } from "./OnboardingScreen.jsx";
import { HomeScreen } from "./HomeScreen.jsx";
import { PresetScreen } from "./PresetScreen.jsx";
import { MusicScreen } from "./music/MusicScreen.jsx";
import { PlayerScreen } from "./PlayerScreen.jsx";
import { SessionScreen } from "./SessionScreen.jsx";
import { QueueScreen } from "./QueueScreen.jsx";
import { ReviewScreen } from "./ReviewScreen.jsx";
import { StatsScreen } from "./stats/StatsScreen.jsx";
import { ProfileScreen } from "./profile/ProfileScreen.jsx";

export const screens = {
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
  profile: ProfileScreen,
};

export {
  SplashScreen,
  LoginScreen,
  OnboardingScreen,
  HomeScreen,
  PresetScreen,
  MusicScreen,
  PlayerScreen,
  SessionScreen,
  QueueScreen,
  ReviewScreen,
  StatsScreen,
  ProfileScreen,
};
