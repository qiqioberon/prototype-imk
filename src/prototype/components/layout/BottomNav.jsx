import { ChartNoAxesColumn, House, ListOrdered, Music4 } from "lucide-react";

import { usePrototype } from "../../context/PrototypeProvider.jsx";
import { cx } from "../../lib/format.js";

export function BottomNav() {
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
