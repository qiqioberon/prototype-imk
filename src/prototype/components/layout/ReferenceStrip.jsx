import { referenceImages } from "../../data.js";
import { usePrototype } from "../../context/PrototypeProvider.jsx";

export function ReferenceStrip() {
  const { t } = usePrototype();
  const refs = [
    { label: "Splash", image: referenceImages.splash },
    { label: "Login", image: referenceImages.login },
    { label: "Home", image: referenceImages.home },
    { label: "Logo", image: referenceImages.logo },
  ];

  return (
    <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{t("layout.localReferences")}</p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {refs.map((item) => (
          <div key={item.label} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <div className="aspect-[9/16] bg-white">
              <img src={item.image} alt={`${item.label} reference`} className="h-full w-full object-cover" />
            </div>
            <div className="truncate px-2 py-1 text-center text-[10px] font-medium text-slate-500">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
