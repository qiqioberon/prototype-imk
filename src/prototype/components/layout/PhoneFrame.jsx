import { PrototypeToast } from "./PrototypeToast.jsx";

export function PhoneFrame({ children }) {
  return (
    <div className="relative h-[844px] w-[390px] overflow-hidden rounded-[42px] border-[10px] border-[#0b1930] bg-white shadow-[0_30px_80px_rgba(8,43,92,0.24)]">
      <div className="pointer-events-none absolute left-1/2 top-0 z-30 h-7 w-40 -translate-x-1/2 rounded-b-[18px] bg-[#0b1930]" />
      {children}
      <PrototypeToast />
    </div>
  );
}
