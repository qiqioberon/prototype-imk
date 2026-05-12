import { screenLabels } from "../../routes.js";
import { usePrototype } from "../../context/PrototypeProvider.jsx";
import { cx } from "../../lib/format.js";

export function ScreenSwitcher() {
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
