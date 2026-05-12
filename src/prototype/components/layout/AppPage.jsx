import { BottomNav } from "./BottomNav.jsx";
import { MiniPlayer } from "./MiniPlayer.jsx";
import { StatusBar } from "./StatusBar.jsx";

export function AppPage({ children, showMiniPlayer = true }) {
  return (
    <div className="relative h-full bg-[#FAFCFE]">
      <StatusBar />
      {children}
      {showMiniPlayer ? <MiniPlayer /> : null}
      <BottomNav />
    </div>
  );
}
