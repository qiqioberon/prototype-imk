import { usePrototype } from "../../context/PrototypeProvider.jsx";
import { Avatar } from "./Avatar.jsx";
import { Pill } from "./Pill.jsx";

export function TopTabs() {
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
