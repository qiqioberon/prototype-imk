import { usePrototype } from "../../context/PrototypeProvider.jsx";
import { Avatar } from "./Avatar.jsx";
import { Pill } from "./Pill.jsx";

export function TopTabs() {
  const { screen, setScreen, t } = usePrototype();
  const activeHome = ["home", "preset", "onboarding", "profile"].includes(screen);
  const activeSession = ["session", "player", "review"].includes(screen);

  return (
    <div className="flex items-center gap-3">
      <div className="grid min-w-0 flex-1 grid-cols-3 gap-2">
        <Pill active={activeHome} onClick={() => setScreen("home")}>
          <span>
            {t("layout.quickFocus").split(" ")[0]}
            <br />
            {t("layout.quickFocus").split(" ").slice(1).join(" ") || t("layout.quickFocus")}
          </span>
        </Pill>
        <Pill active={screen === "music"} onClick={() => setScreen("music")}>
          {t("layout.music")}
        </Pill>
        <Pill active={activeSession} onClick={() => setScreen("session")}>
          {t("layout.session")}
        </Pill>
      </div>
      <Avatar />
    </div>
  );
}
