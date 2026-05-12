import { UserCircle2 } from "lucide-react";

import { usePrototype } from "../../context/PrototypeProvider.jsx";

export function Avatar() {
  const { setScreen, t } = usePrototype();

  return (
    <button
      type="button"
      onClick={() => setScreen("profile")}
      aria-label={t("layout.accountAria")}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#EAF7F8] ring-1 ring-[#CDE4EA] transition hover:bg-[#DDF2F4]"
    >
      <UserCircle2 className="h-7 w-7 text-[#082B5C]" />
    </button>
  );
}
