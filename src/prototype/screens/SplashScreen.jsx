import { usePrototype } from "../context/PrototypeProvider.jsx";
import { BrandMark, StatusBar } from "../components/layout/index.js";

export function SplashScreen() {
  const { setScreen, t } = usePrototype();
  return (
    <div className="relative h-full overflow-hidden bg-[linear-gradient(180deg,#99ECF5_0%,#F7FCFE_22%,#FFFFFF_100%)]">
      <StatusBar />
      <div className="absolute left-5 top-16 h-16 w-24 rounded-full bg-white/80 blur-sm" />
      <div className="absolute right-6 top-28 h-10 w-20 rounded-full bg-sky-50" />
      <div className="absolute left-10 top-1/3 h-8 w-16 rounded-full bg-sky-50/80" />
      <div className="relative z-10 flex h-full flex-col items-center px-8 pb-10 pt-16">
        <BrandMark />
        <div className="mt-4 text-center">
          <div className="text-[3rem] font-black leading-none tracking-tight text-[#082B5C]">
            Focus<span className="text-[#1C9AA0]">Tunes</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-[#0d5970]">{t("splash.tagline")}</p>
        </div>

        <div className="relative mt-auto flex w-full justify-center">
          <div className="absolute bottom-0 h-44 w-[110%] rounded-t-[50%] bg-[#BEE6EC]" />
          <div className="absolute bottom-10 left-0 h-36 w-20 rounded-t-full bg-[#5BAFB7] opacity-40" />
          <div className="absolute bottom-4 right-4 h-24 w-16 rounded-full bg-[#0A4A6B] opacity-20" />
          <div className="relative z-10 flex w-full items-end justify-center gap-4">
            <div className="mb-6 h-52 w-40 rounded-b-[28px] rounded-t-[80px] bg-[#1C9AA0] p-2 shadow-lg">
              <div className="flex h-full items-end justify-center rounded-[24px] bg-[#264155]">
                <div className="mb-2 h-10 w-16 rounded-t-full bg-white/90" />
              </div>
            </div>
            <div className="mb-1 h-44 w-28 rotate-6 rounded-[28px] bg-[#26384A]" />
          </div>
        </div>

        <button
          onClick={() => setScreen("login")}
          className="mt-8 w-full rounded-2xl bg-[#082B5C] px-5 py-4 text-base font-semibold text-white shadow-[0_12px_30px_rgba(8,43,92,0.28)]"
        >
          {t("splash.start")}
        </button>
      </div>
    </div>
  );
}
